const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();




// Import controllers
const { uploadFile,supabase, emailStorage } = require('./emailHandlers');
const {
  toggleEmailStatus,
  getPaginatedEmails,
  getTestEmails,
  getAllEmails,
  healthCheck,
  setupGuide,
  deleteEmail,
  deleteAllEmails,deleteDuplicateEmails,markEmailAsReplied
} = require('./queryHandlers');

const { 
  sendEmailsToAll, 
  getEmailLogs,
  // Add these new imports for the delete functionality
  deleteEmailLog,
  deleteAllEmailLogs,
  sendSingleEmail,batchDeleteLogs // Add this new import
} = require('./emailSender');

const app = express();
const PORT = process.env.PORT || 5000;

// Improved CORS configuration
app.use(cors({
  origin: ["https://resume-sender.netlify.app",'http://localhost:3000', 'http://localhost:5173', '*'], // Add your frontend URLs
  methods: ['GET', 'POST','PUT', 'DELETE','OPTIONS'], // Add DELETE to allowed methods
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// For parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Configure multer for CSV/ODS file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const allowedExtensions = ['.csv', '.ods', '.pdf', '.docx'];

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (allowedExtensions.includes(ext)) {
//       cb(null, true);
//     } else {
//       cb(new Error(`Allowed file types: ${allowedExtensions.join(', ')}`));
//     }
//   }
// });


const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for file buffers
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.docx', '.csv', '.ods'];
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Allowed file types: ${allowedExtensions.join(', ')}`));
    }
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message
    });
  }
  next(err);
});

// Error handling middleware (place after routes)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('file')) {
    return res.status(400).json({ 
      error: 'File upload error',
      message: err.message 
    });
  }
  next(err);
});
// Define API router
const apiRouter = express.Router();

// Email query routes
apiRouter.get('/emails/paginated', getPaginatedEmails);
apiRouter.put('/api/emails/:id/toggle-status', toggleEmailStatus);
apiRouter.get('/emails/test', getTestEmails);
apiRouter.get('/emails', getAllEmails);
// Add this to your routes file or main server file
app.put('/api/emails/:id/toggle-status', toggleEmailStatus);
// Email upload route
apiRouter.post('/upload', upload.single('file'), uploadFile);

// Email sending routes
apiRouter.post('/send-emails', sendEmailsToAll);
apiRouter.post('/send-email', sendSingleEmail); // Add this new route

// Email logs routes
apiRouter.get('/logs', getEmailLogs);
apiRouter.delete('/logs/:id', deleteEmailLog);
apiRouter.delete('/logs', deleteAllEmailLogs);
apiRouter.post('/logs/batch-delete', batchDeleteLogs);
apiRouter.delete('/emails-duplicates', deleteDuplicateEmails); // Route for deleting duplicate emails
// Delete routes
apiRouter.delete('/emails/:id', deleteEmail); // Route for deleting single email


// Add the new route for marking emails as replied
apiRouter.post('/emails/:emailId/mark-replied', markEmailAsReplied);
apiRouter.delete('/emails-batch', deleteAllEmails); // Route for deleting all emails in batch

// Mount API router
app.use('/api', apiRouter);
// Add a single email
app.post('/api/emails', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Prepare data for storage
    const emailData = {
      email: email.trim(),
      created_at: new Date().toISOString()
    };
    
    try {
      // Check if Supabase table exists
      const { data, error } = await supabase
        .from('emails')
        .select('count')
        .limit(1);
      
      // If there's a table error, use in-memory storage instead
      if (error && error.code === '42P01') {
        console.log('Table "emails" does not exist. Using in-memory storage instead.');
        emailStorage.push(emailData);
        
        return res.status(200).json({ 
          success: true,
          message: 'Email stored in memory (Supabase table missing)',
          note: "The emails table doesn't exist in your Supabase database. Data stored in server memory."
        });
      } else if (error) {
        console.error('Error checking Supabase:', error);
        return res.status(500).json({ error: `Database error: ${error.message}` });
      }
      
      // If we're here, the table exists, so insert the data
      const { error: insertError } = await supabase
        .from('emails')
        .insert([emailData]);
      
      if (insertError) {
        console.error('Error inserting data:', insertError);
        return res.status(500).json({ error: `Database insertion error: ${insertError.message}` });
      }
      
      res.status(200).json({ 
        success: true,
        message: 'Email successfully added to the database'
      });
      
    } catch (error) {
      console.error('Error with Supabase operation:', error);
      return res.status(500).json({ error: `Supabase operation error: ${error.message}` });
    }
    
  } catch (error) {
    console.error('Error adding email:', error);
    res.status(500).json({ error: error.message });
  }
});
// Add these routes to your Express backend

/**
 * Mark an email as replied
 * POST /api/emails/:id/mark-replied
 */
/**
 * Add a filter to the main emails endpoint to get emails by replied status
 * GET /api/emails?replied=true|false
 */
// Update your existing GET /api/emails route to include this filter
app.get('/api/emails', async (req, res) => {
  try {
    let query = `SELECT * FROM emails`;
    let conditions = [];
    let values = [];
    let paramIndex = 1;
    
    // Check if replied filter is specified
    if (req.query.replied !== undefined) {
      const repliedValue = req.query.replied === 'true';
      conditions.push(`replied = $${paramIndex}`);
      values.push(repliedValue);
      paramIndex++;
    }
    
    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY id DESC`;
    
    const result = await db.query(query, values);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching emails',
      error: error.message
    });
  }
});

// Backward compatibility for direct routes (can be removed later)
app.post('/send-emails', sendEmailsToAll);

// System routes
app.get('/health', healthCheck);
app.get('/setup-guide', setupGuide);


// Add an OPTIONS handler for preflight requests
app.options('*', cors());

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});



// GET - Fetch all email templates
app.get('/api/email-templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch email templates',
        details: error.message 
      });
    }

    // Transform data to match frontend expectations
    const templates = data.map(template => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      content: template.content,
      created_at: template.created_at,
      updated_at: template.updated_at
    }));

    res.status(200).json({
      success: true,
      templates: templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// POST - Create a new email template
app.post('/api/email-templates', async (req, res) => {
  try {
    const { name, subject, content } = req.body;

    // Validation
    if (!name || !subject || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, subject, and content are required'
      });
    }

    // Additional validation
    if (name.trim().length < 3) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Template name must be at least 3 characters long'
      });
    }

    if (subject.trim().length < 5) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Subject must be at least 5 characters long'
      });
    }

    if (content.trim().length < 50) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Content must be at least 50 characters long'
      });
    }

    // Check if template name already exists
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('name')
      .eq('name', name.trim())
      .single();

    if (existingTemplate) {
      return res.status(409).json({
        error: 'Template name already exists',
        message: 'Please choose a different template name'
      });
    }

    // Insert new template
    const { data, error } = await supabase
      .from('email_templates')
      .insert([
        {
          name: name.trim(),
          subject: subject.trim(),
          content: content.trim()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({
        error: 'Failed to create email template',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Email template created successfully',
      template: {
        id: data.id,
        name: data.name,
        subject: data.subject,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET - Fetch a single email template by ID
app.get('/api/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Template not found',
        message: 'The specified template does not exist'
      });
    }

    res.status(200).json({
      success: true,
      template: {
        id: data.id,
        name: data.name,
        subject: data.subject,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// PUT - Update an existing email template
app.put('/api/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content } = req.body;

    // Validation
    if (!name || !subject || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, subject, and content are required'
      });
    }

    // Additional validation
    if (name.trim().length < 3) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Template name must be at least 3 characters long'
      });
    }

    if (subject.trim().length < 5) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Subject must be at least 5 characters long'
      });
    }

    if (content.trim().length < 50) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Content must be at least 50 characters long'
      });
    }

    // Check if template exists
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        error: 'Template not found',
        message: 'The specified template does not exist'
      });
    }

    // Check if new name conflicts with another template
    if (name.trim() !== existingTemplate.name) {
      const { data: nameConflict } = await supabase
        .from('email_templates')
        .select('name')
        .eq('name', name.trim())
        .neq('id', id)
        .single();

      if (nameConflict) {
        return res.status(409).json({
          error: 'Template name already exists',
          message: 'Please choose a different template name'
        });
      }
    }

    // Update template
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        name: name.trim(),
        subject: subject.trim(),
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return res.status(500).json({
        error: 'Failed to update email template',
        details: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email template updated successfully',
      template: {
        id: data.id,
        name: data.name,
        subject: data.subject,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// DELETE - Delete an email template
app.delete('/api/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        error: 'Template not found',
        message: 'The specified template does not exist'
      });
    }

    // Delete template
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return res.status(500).json({
        error: 'Failed to delete email template',
        details: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email template deleted successfully',
      deletedTemplate: {
        id: existingTemplate.id,
        name: existingTemplate.name,
        subject: existingTemplate.subject,
        content: existingTemplate.content
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ========================================
// EMAIL SENDING ROUTE
// ========================================

// POST - Send emails with resume
app.post('/api/send-emails', upload.single('resume'), async (req, res) => {
  try {
    const { subject, content } = req.body;
    const resumeFile = req.file;

    // Validation
    if (!resumeFile) {
      return res.status(400).json({ 
        error: 'Resume file is required',
        message: 'Please upload a resume file'
      });
    }

    if (!subject || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Subject and content are required' 
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(resumeFile.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF and DOCX files are allowed'
      });
    }

    // TODO: Add your email sending logic here
    // This is where you would integrate with your email service
    // For example, using nodemailer, SendGrid, etc.
    
    console.log('Email Details:');
    console.log('Subject:', subject);
    console.log('Content:', content);
    console.log('Resume File:', resumeFile.originalname);
    console.log('File Size:', resumeFile.size);
    console.log('File Type:', resumeFile.mimetype);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate successful email sending
    // Replace this with your actual email sending implementation
    const emailResults = {
      totalEmails: 10, // Replace with actual count
      successfulEmails: 8, // Replace with actual count
      failedEmails: 2, // Replace with actual count
      errors: [] // Replace with actual errors if any
    };

    // Log email sending activity (optional)
    try {
      await supabase
        .from('email_logs')
        .insert([
          {
            subject: subject,
            content: content,
            resume_filename: resumeFile.originalname,
            total_sent: emailResults.successfulEmails,
            total_failed: emailResults.failedEmails,
            sent_at: new Date().toISOString()
          }
        ]);
    } catch (logError) {
      console.error('Error logging email activity:', logError);
      // Don't fail the request if logging fails
    }

    res.status(200).json({ 
      success: true,
      message: 'Emails sent successfully',
      results: {
        totalEmails: emailResults.totalEmails,
        successfulEmails: emailResults.successfulEmails,
        failedEmails: emailResults.failedEmails,
        errors: emailResults.errors
      }
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ 
      error: 'Failed to send emails',
      details: error.message
    });
  }
});






// Get all resumes
app.get('/api/resumes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resumes:', error);
      return res.status(500).json({ error: 'Failed to fetch resumes' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single resume by ID
app.get('/api/resumes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching resume:', error);
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download resume file by ID
app.get('/api/resumes/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(resume.file_data, 'base64');
    
    res.set({
      'Content-Type': resume.file_type,
      'Content-Disposition': `attachment; filename="${resume.file_name}"`,
      'Content-Length': fileBuffer.length
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/resumes', upload.single('resume'), async (req, res) => {
  try {
    // Check for file validation errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        error: req.fileValidationError
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Validate file buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'File processing error - invalid file format'
      });
    }

    // Validate required fields
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Resume name is required'
      });
    }

    // Process file data
    const fileBase64 = req.file.buffer.toString('base64');
    const resumeData = {
      name: name.trim(),
      description: description?.trim() || null,
      file_name: req.file.originalname,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      file_data: fileBase64,
      created_at: new Date().toISOString()
    };

    // Insert into database
    const { data, error } = await supabase
      .from('resumes')
      .insert([resumeData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save resume to database'
      });
    }

    // Prepare response
    const { file_data, ...responseData } = data;

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
// Update resume (metadata only)
app.put('/api/resumes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Resume name is required' });
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('resumes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resume:', error);
      return res.status(500).json({ error: 'Failed to update resume' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Remove file_data from response
    const { file_data, ...responseData } = data;

    res.json({ 
      success: true, 
      message: 'Resume updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete resume
app.delete('/api/resumes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting resume:', error);
      return res.status(500).json({ error: 'Failed to delete resume' });
    }

    res.json({ 
      success: true, 
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email logs available at: http://localhost:${PORT}/api/logs`);
});










