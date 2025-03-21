const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
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
  deleteAllEmails,deleteDuplicateEmails
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
  methods: ['GET', 'POST','PUT', 'DELETE'], // Add DELETE to allowed methods
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

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.ods') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and ODS files are allowed'));
    }
  }
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

// Backward compatibility for direct routes (can be removed later)
app.post('/send-emails', sendEmailsToAll);

// System routes
app.get('/health', healthCheck);
app.get('/setup-guide', setupGuide);


// Add an OPTIONS handler for preflight requests
app.options('*', cors());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email logs available at: http://localhost:${PORT}/api/logs`);
});
