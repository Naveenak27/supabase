const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || 'https://izeiyujebczudhvsvbon.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// Validate Supabase key
if (!supabaseKey) {
  console.error('SUPABASE_KEY is not set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Alternative email storage using in-memory array when database is not available
let emailStorage = [];

// Extract emails from CSV file
const extractEmailsFromCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    Papa.parse(fs.createReadStream(filePath), {
      complete: (results) => {
        results.data
          .flat()
          .filter(email => email && typeof email === 'string' && email.includes('@'))
          .forEach(email => {
            emails.push(email.trim());
          });
        resolve(emails);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Extract emails from ODS file
const extractEmailsFromODS = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      const emails = jsonData
        .flat()
        .filter(email => email && typeof email === 'string' && email.includes('@'))
        .map(email => email.trim());
      
      resolve(emails);
    } catch (error) {
      reject(error);
    }
  });
};

// Upload file and extract emails
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let emails = [];
    try {
      if (fileExt === '.csv') {
        emails = await extractEmailsFromCSV(filePath);
      } else if (fileExt === '.ods') {
        emails = await extractEmailsFromODS(filePath);
      }
    } catch (error) {
      console.error('Error extracting emails:', error);
      return res.status(400).json({ error: `Error extracting emails: ${error.message}` });
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid emails found in the file' });
    }

    console.log(`Found ${emails.length} emails to insert`);

    // Prepare data for storage
    const emailData = emails.map(email => ({
      email: email,
      created_at: new Date().toISOString()
    }));

    try {
      // Try to use Supabase if possible
      const { data, error } = await supabase
        .from('emails')
        .select('count')
        .limit(1);

      // If there's a table error, use in-memory storage instead
      if (error && error.code === '42P01') {
        console.log('Table "emails" does not exist. Using in-memory storage instead.');
        emailStorage = [...emailStorage, ...emailData];
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        
        return res.status(200).json({ 
          success: true, 
          count: emails.length,
          message: `Successfully stored ${emails.length} emails in memory (Supabase table missing)`,
          note: "The emails table doesn't exist in your Supabase database. Data stored in server memory."
        });
      } else if (error) {
        console.error('Error checking Supabase:', error);
        return res.status(500).json({ error: `Database error: ${error.message}` });
      }
      
      // If we're here, the table exists, so insert the data
      const { error: insertError } = await supabase
        .from('emails')
        .insert(emailData);

      if (insertError) {
        console.error('Error inserting data:', insertError);
        return res.status(500).json({ error: `Database insertion error: ${insertError.message}` });
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.status(200).json({ 
        success: true, 
        count: emails.length,
        message: `Successfully stored ${emails.length} emails in the database` 
      });
      
    } catch (error) {
      console.error('Error with Supabase operation:', error);
      return res.status(500).json({ error: `Supabase operation error: ${error.message}` });
    }
    
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  supabase,
  emailStorage,
  uploadFile
};
