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

// Create in-memory storage for replied emails when DB is unavailable
const inMemoryRepliedEmails = [];

// Initialize database connection with improved error handling
// We'll only initialize the database if the pg module is available
let db;
try {
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout settings
    connectionTimeoutMillis: 10000, // 10 seconds timeout for connection attempts
    idleTimeoutMillis: 30000,      // how long a client is allowed to remain idle before being closed
    max: 10                        // maximum number of clients in the pool
  });

  // Add connection error handling
  db.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
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
    connect: () => Promise.resolve({ 
      query: () => Promise.resolve({ rows: [] }),
      release: () => {}
    }),
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

// Helper function to retry database operations
async function retryOperation(operation, maxRetries = 3, retryDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      lastError = error;
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // If we get here, all attempts failed
  throw lastError;
}

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
        try {
          // Use retry logic for checking table existence
          await retryOperation(async () => {
            // Check if Supabase table exists
            const { data, error } = await supabase
              .from('emails')
              .select('count')
              .limit(1);
            
            // If there's a table error, use in-memory storage instead
            if (error && error.code === '42P01') {
              throw new Error('Table "emails" does not exist');
            } else if (error) {
              throw error;
            }
            
            // If we're here, the table exists, so insert the data
            const { error: insertError } = await supabase
              .from('emails')
              .insert([emailData]);
            
            if (insertError) {
              throw insertError;
            }
          });
        } catch (retryError) {
          console.log('Supabase operations failed after retries, using in-memory storage:', retryError.message);
          emailStorage.push(emailData);
          
          return res.status(200).json({ 
            success: true,
            message: 'Email stored in memory (Supabase operation failed)',
            note: "Unable to access Supabase. Data stored in server memory."
          });
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
      
      // Fallback to in-memory as last resort
      try {
        emailStorage.push(emailData);
        return res.status(200).json({ 
          success: true,
          message: 'Email stored in memory (after error)',
          note: "Error occurred with database operations. Data stored in server memory."
        });
      } catch (fallbackError) {
        return res.status(500).json({ error: `Storage operation failed completely: ${fallbackError.message}` });
      }
    }
    
  } catch (error) {
    console.error('Error adding email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Handle in-memory storage for replied emails when database is unavailable
 */
function handleInMemoryReply(req, res) {
  try {
    const emailId = req.params.id;
    console.log(`Marking email ${emailId} as replied using in-memory storage`);
    
    // Find the email in the in-memory storage
    const emailIndex = emailStorage.findIndex(e => e.id === emailId || e.id === parseInt(emailId));
    
    if (emailIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in memory storage'
      });
    }
    
    // Update the email in memory
    emailStorage[emailIndex].replied = true;
    
    // Create a reply record
    const replyRecord = {
      id: Date.now().toString(),
      email_id: emailId,
      replied_at: req.body.replied_at || new Date().toISOString(),
      notes: req.body.notes || null,
      replied_by: req.body.replied_by || null
    };
    
    inMemoryRepliedEmails.push(replyRecord);
    
    return res.status(200).json({
      success: true,
      message: 'Email marked as replied successfully (using in-memory storage)',
      data: {
        replied_id: replyRecord.id,
        email: emailStorage[emailIndex],
        note: "Database unavailable, using in-memory storage. Data will be lost on server restart."
      }
    });
    
  } catch (error) {
    console.error('Error in in-memory reply handler:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error in in-memory reply processing',
      error: error.message
    });
  }
}

/**
 * Mark an email as replied with improved error handling and retry logic
 * POST /api/emails/:id/mark-replied
 */
app.post('/api/emails/:id/mark-replied', async (req, res) => {
  let client = null;
  
  try {
    // Check if database is available
    if (!db) {
      return handleInMemoryReply(req, res);
    }

    const emailId = req.params.id;
    console.log(`Marking email ${emailId} as replied`);
    
    try {
      // Use retry logic to get a client with timeout
      client = await retryOperation(async () => {
        // Get a client with a timeout
        const clientPromise = db.connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        return await Promise.race([clientPromise, timeoutPromise]);
      });
      
      // First, check if email exists
      const checkEmailQuery = 'SELECT * FROM emails WHERE id = $1';
      const emailResult = await client.query(checkEmailQuery, [emailId]);
      
      if (emailResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }
      
      let transactionResult;
      
      // Use retry logic for the transaction
      try {
        transactionResult = await retryOperation(async () => {
          try {
            // Begin transaction
            await client.query('BEGIN');
            
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
            
            const replyResult = await client.query(insertReplyQuery, insertReplyValues);
            
            // Update the replied status in emails table
            const updateEmailQuery = `
              UPDATE emails
              SET replied = TRUE
              WHERE id = $1
              RETURNING id, email, active, replied
            `;
            
            const updateResult = await client.query(updateEmailQuery, [emailId]);
            
            // Commit transaction
            await client.query('COMMIT');
            
            return {
              replied_id: replyResult.rows[0].id,
              email: updateResult.rows[0]
            };
          } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error; // Re-throw to trigger retry
          }
        });
      } catch (transactionError) {
        throw transactionError; // Propagate to outer catch
      }
      
      return res.status(200).json({
        success: true,
        message: 'Email marked as replied successfully',
        data: transactionResult
      });
      
    } catch (dbError) {
      console.error('Database operation failed, falling back to in-memory storage:', dbError);
      
      // Fallback to in-memory storage
      return handleInMemoryReply(req, res);
    }
    
  } catch (error) {
    console.error('Error marking email as replied:', error);
    
    // Handle connection timeout specifically
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        message: 'Database connection timed out after multiple attempts',
        error: 'The connection to the database timed out. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error marking email as replied',
      error: error.message
    });
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
});

/**
 * Get all replied emails with their details
 * GET /api/replied-emails
 */
app.get('/api/replied-emails', async (req, res) => {
  let client = null;
  
  try {
    // Check if database is available
    if (!db) {
      // Return in-memory data if available
      return res.status(200).json({
        success: true,
        usingFallback: true,
        count: inMemoryRepliedEmails.length,
        data: inMemoryRepliedEmails
      });
    }

    try {
      // Use retry logic to get a client
      client = await retryOperation(async () => {
        return await db.connect();
      });
      
      const query = `
        SELECT re.id, re.email_id, re.replied_at, re.notes, re.replied_by, e.email 
        FROM replied_emails re
        JOIN emails e ON re.email_id = e.id
        ORDER BY re.replied_at DESC
      `;
      
      const result = await client.query(query);
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
      
    } catch (dbError) {
      console.error('Database query failed, returning in-memory data:', dbError);
      
      // Return in-memory data as fallback
      return res.status(200).json({
        success: true,
        usingFallback: true,
        count: inMemoryRepliedEmails.length,
        data: inMemoryRepliedEmails
      });
    }
    
  } catch (error) {
    console.error('Error fetching replied emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching replied emails',
      error: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * Add a filter to the main emails endpoint to get emails by replied status
 * GET /api/emails?replied=true|false
 */
app.get('/api/emails', async (req, res) => {
  let client = null;
  
  try {
    // Check if database is available
    if (!db) {
      // Filter in-memory emails if needed
      let filteredEmails = [...emailStorage];
      
      if (req.query.replied !== undefined) {
        const repliedValue = req.query.replied === 'true';
        filteredEmails = filteredEmails.filter(email => !!email.replied === repliedValue);
      }
      
      return res.status(200).json({
        success: true,
        usingFallback: true,
        count: filteredEmails.length,
        data: filteredEmails
      });
    }

    try {
      // Use retry logic to get a client
      client = await retryOperation(async () => {
        return await db.connect();
      });
      
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
      
      const result = await client.query(query, values);
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
      
    } catch (dbError) {
      console.error('Database query failed, using in-memory data:', dbError);
      
      // Fallback to filtering in-memory emails
      let filteredEmails = [...emailStorage];
      
      if (req.query.replied !== undefined) {
        const repliedValue = req.query.replied === 'true';
        filteredEmails = filteredEmails.filter(email => !!email.replied === repliedValue);
      }
      
      return res.status(200).json({
        success: true,
        usingFallback: true,
        count: filteredEmails.length,
        data: filteredEmails
      });
    }
    
  } catch (error) {
    console.error('Error fetching emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching emails',
      error: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * Endpoint to check and diagnose database connection issues
 * GET /api/check-db-connection
 */
app.get('/api/check-db-connection', async (req, res) => {
  try {
    // Check environment variables
    const connectionInfo = {
      hasConnectionString: !!process.env.SUPABASE_URL,
      envVarLength: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Don't expose full connection string for security reasons
    if (connectionInfo.hasConnectionString) {
      connectionInfo.connectionStringPreview = `${process.env.SUPABASE_URL.substring(0, 10)}...`;
    }
    
    // Try to connect with timeout
    let connectionStatus = 'unknown';
    let dbVersion = null;
    let error = null;
    
    try {
      const result = await Promise.race([
        db.query('SELECT version()'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
      ]);
      
      connectionStatus = 'connected';
      dbVersion = result.rows[0].version;
    } catch (dbError) {
      connectionStatus = 'failed';
      error = {
        message: dbError.message,
        code: dbError.code
      };
    }
    
    return res.status(200).json({
      success: true,
      connectionInfo,
      connectionStatus,
      dbVersion,
      error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking database connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking database connection',
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
