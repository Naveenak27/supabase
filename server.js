const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import controllers
const { uploadFile, supabase, emailStorage } = require('./emailHandlers');
const {
  toggleEmailStatus,
  getPaginatedEmails,
  getTestEmails,
  getAllEmails,
  healthCheck,
  setupGuide,
  deleteEmail,
  deleteAllEmails,
  deleteDuplicateEmails
} = require('./queryHandlers');

const { 
  sendEmailsToAll, 
  getEmailLogs,
  deleteEmailLog,
  deleteAllEmailLogs,
  sendSingleEmail,
  batchDeleteLogs
} = require('./emailSender');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
// We'll only initialize the database if the pg module is available
let db;
try {
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test database connection
  db.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.stack);
    } else {
      console.log('Database connected successfully at:', res.rows[0].now);
    }
  });
} catch (error) {
  console.warn('PostgreSQL module not available. Some features may be limited:', error.message);
  // Create a mock db object to prevent errors when functions try to use it
  db = {
    query: () => Promise.resolve({ rows: [] }),
    // Add other methods you might be using
  };
}

// Make sure to export the db so it can be used in other files if needed
module.exports = { db };

// Improved CORS configuration
app.use(cors({
  origin: ["https://resume-sender.netlify.app", 'http://localhost:3000', 'http://localhost:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
apiRouter.put('/emails/:id/toggle-status', toggleEmailStatus);
apiRouter.get('/emails/test', getTestEmails);
apiRouter.get('/emails', getAllEmails);

// Email upload route
apiRouter.post('/upload', upload.single('file'), uploadFile);

// Email sending routes
apiRouter.post('/send-emails', sendEmailsToAll);
apiRouter.post('/send-email', sendSingleEmail);

// Email logs routes
apiRouter.get('/logs', getEmailLogs);
apiRouter.delete('/logs/:id', deleteEmailLog);
apiRouter.delete('/logs', deleteAllEmailLogs);
apiRouter.post('/logs/batch-delete', batchDeleteLogs);
apiRouter.delete('/emails-duplicates', deleteDuplicateEmails);

// Delete routes
apiRouter.delete('/emails/:id', deleteEmail);
apiRouter.delete('/emails-batch', deleteAllEmails);

// Mount API router
app.use('/api', apiRouter);

// Direct route for toggle email status (for backward compatibility)
app.put('/api/emails/:id/toggle-status', toggleEmailStatus);

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
      // Check if we have a database connection and Supabase is available
      if (db && supabase) {
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
      } else {
        // Fallback to in-memory storage if no database connection
        emailStorage.push(emailData);
        console.log('Using in-memory storage due to missing database connection');
      }
      
      res.status(200).json({ 
        success: true,
        message: 'Email successfully added'
      });
      
    } catch (error) {
      console.error('Error with storage operation:', error);
      return res.status(500).json({ error: `Storage operation error: ${error.message}` });
    }
    
  } catch (error) {
    console.error('Error adding email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark an email as replied
 * POST /api/emails/:id/mark-replied
 */
app.post('/api/emails/:id/mark-replied', async (req, res) => {
  try {
    // Check if database is available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const emailId = req.params.id;
    console.log(`Marking email ${emailId} as replied`);
    
    // First, check if email exists
    const checkEmailQuery = 'SELECT * FROM emails WHERE id = $1';
    const emailResult = await db.query(checkEmailQuery, [emailId]);
    
    if (emailResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Insert into replied_emails table
    const insertReplyQuery = `
      INSERT INTO replied_emails (email_id, replied_at, notes, replied_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const insertReplyValues = [
      emailId,
      req.body.replied_at || new Date().toISOString(),
      req.body.notes || null,
      req.body.replied_by || null
    ];
    
    const replyResult = await db.query(insertReplyQuery, insertReplyValues);
    
    // Update the replied status in emails table
    const updateEmailQuery = `
      UPDATE emails
      SET replied = TRUE
      WHERE id = $1
      RETURNING id, email, active, replied
    `;
    
    const updateResult = await db.query(updateEmailQuery, [emailId]);
    
    // Commit transaction
    await db.query('COMMIT');
    
    return res.status(200).json({
      success: true,
      message: 'Email marked as replied successfully',
      data: {
        replied_id: replyResult.rows[0].id,
        email: updateResult.rows[0]
      }
    });
    
  } catch (error) {
    // Rollback transaction on error
    if (db) {
      try {
        await db.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    console.error('Error marking email as replied:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking email as replied',
      error: error.message
    });
  }
});

/**
 * Get all replied emails with their details
 * GET /api/replied-emails
 */
app.get('/api/replied-emails', async (req, res) => {
  try {
    // Check if database is available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const query = `
      SELECT re.id, re.email_id, re.replied_at, re.notes, re.replied_by, e.email 
      FROM replied_emails re
      JOIN emails e ON re.email_id = e.id
      ORDER BY re.replied_at DESC
    `;
    
    const result = await db.query(query);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching replied emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching replied emails',
      error: error.message
    });
  }
});

/**
 * Add a filter to the main emails endpoint to get emails by replied status
 * GET /api/emails?replied=true|false
 */
app.get('/api/emails', async (req, res) => {
  try {
    // Check if database is available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available'
      });
    }

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email logs available at: http://localhost:${PORT}/api/logs`);
});
