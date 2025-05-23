// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// require('dotenv').config();


// // Import controllers
// const { uploadFile,supabase, emailStorage } = require('./emailHandlers');
// const {
//   toggleEmailStatus,
//   getPaginatedEmails,
//   getTestEmails,
//   getAllEmails,
//   healthCheck,
//   setupGuide,
//   deleteEmail,
//   deleteAllEmails,deleteDuplicateEmails,markEmailAsReplied
// } = require('./queryHandlers');

// const { 
//   sendEmailsToAll, 
//   getEmailLogs,
//   // Add these new imports for the delete functionality
//   deleteEmailLog,
//   deleteAllEmailLogs,
//   sendSingleEmail,batchDeleteLogs // Add this new import
// } = require('./emailSender');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Improved CORS configuration
// app.use(cors({
//   origin: ["https://resume-sender.netlify.app",'http://localhost:3000', 'http://localhost:5173', '*'], // Add your frontend URLs
//   methods: ['GET', 'POST','PUT', 'DELETE','OPTIONS'], // Add DELETE to allowed methods
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // For parsing JSON and URL-encoded data
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Configure multer for CSV/ODS file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (ext === '.csv' || ext === '.ods') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only CSV and ODS files are allowed'));
//     }
//   }
// });

// // Define API router
// const apiRouter = express.Router();

// // Email query routes
// apiRouter.get('/emails/paginated', getPaginatedEmails);
// apiRouter.put('/api/emails/:id/toggle-status', toggleEmailStatus);
// apiRouter.get('/emails/test', getTestEmails);
// apiRouter.get('/emails', getAllEmails);
// // Add this to your routes file or main server file
// app.put('/api/emails/:id/toggle-status', toggleEmailStatus);
// // Email upload route
// apiRouter.post('/upload', upload.single('file'), uploadFile);

// // Email sending routes
// apiRouter.post('/send-emails', sendEmailsToAll);
// apiRouter.post('/send-email', sendSingleEmail); // Add this new route

// // Email logs routes
// apiRouter.get('/logs', getEmailLogs);
// apiRouter.delete('/logs/:id', deleteEmailLog);
// apiRouter.delete('/logs', deleteAllEmailLogs);
// apiRouter.post('/logs/batch-delete', batchDeleteLogs);
// apiRouter.delete('/emails-duplicates', deleteDuplicateEmails); // Route for deleting duplicate emails
// // Delete routes
// apiRouter.delete('/emails/:id', deleteEmail); // Route for deleting single email


// // Add the new route for marking emails as replied
// apiRouter.post('/emails/:emailId/mark-replied', markEmailAsReplied);
// apiRouter.delete('/emails-batch', deleteAllEmails); // Route for deleting all emails in batch

// // Mount API router
// app.use('/api', apiRouter);
// // Add a single email
// app.post('/api/emails', async (req, res) => {
//   try {
//     const { email } = req.body;
    
//     if (!email) {
//       return res.status(400).json({ error: 'Email is required' });
//     }
    
//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ error: 'Invalid email format' });
//     }
    
//     // Prepare data for storage
//     const emailData = {
//       email: email.trim(),
//       created_at: new Date().toISOString()
//     };
    
//     try {
//       // Check if Supabase table exists
//       const { data, error } = await supabase
//         .from('emails')
//         .select('count')
//         .limit(1);
      
//       // If there's a table error, use in-memory storage instead
//       if (error && error.code === '42P01') {
//         console.log('Table "emails" does not exist. Using in-memory storage instead.');
//         emailStorage.push(emailData);
        
//         return res.status(200).json({ 
//           success: true,
//           message: 'Email stored in memory (Supabase table missing)',
//           note: "The emails table doesn't exist in your Supabase database. Data stored in server memory."
//         });
//       } else if (error) {
//         console.error('Error checking Supabase:', error);
//         return res.status(500).json({ error: `Database error: ${error.message}` });
//       }
      
//       // If we're here, the table exists, so insert the data
//       const { error: insertError } = await supabase
//         .from('emails')
//         .insert([emailData]);
      
//       if (insertError) {
//         console.error('Error inserting data:', insertError);
//         return res.status(500).json({ error: `Database insertion error: ${insertError.message}` });
//       }
      
//       res.status(200).json({ 
//         success: true,
//         message: 'Email successfully added to the database'
//       });
      
//     } catch (error) {
//       console.error('Error with Supabase operation:', error);
//       return res.status(500).json({ error: `Supabase operation error: ${error.message}` });
//     }
    
//   } catch (error) {
//     console.error('Error adding email:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
// // Add these routes to your Express backend

// /**
//  * Mark an email as replied
//  * POST /api/emails/:id/mark-replied
//  */
// /**
//  * Add a filter to the main emails endpoint to get emails by replied status
//  * GET /api/emails?replied=true|false
//  */
// // Update your existing GET /api/emails route to include this filter
// app.get('/api/emails', async (req, res) => {
//   try {
//     let query = `SELECT * FROM emails`;
//     let conditions = [];
//     let values = [];
//     let paramIndex = 1;
    
//     // Check if replied filter is specified
//     if (req.query.replied !== undefined) {
//       const repliedValue = req.query.replied === 'true';
//       conditions.push(`replied = $${paramIndex}`);
//       values.push(repliedValue);
//       paramIndex++;
//     }
    
//     // Add WHERE clause if conditions exist
//     if (conditions.length > 0) {
//       query += ` WHERE ${conditions.join(' AND ')}`;
//     }
    
//     query += ` ORDER BY id DESC`;
    
//     const result = await db.query(query, values);
    
//     return res.status(200).json({
//       success: true,
//       count: result.rows.length,
//       data: result.rows
//     });
    
//   } catch (error) {
//     console.error('Error fetching emails:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching emails',
//       error: error.message
//     });
//   }
// });

// // Backward compatibility for direct routes (can be removed later)
// app.post('/send-emails', sendEmailsToAll);

// // System routes
// app.get('/health', healthCheck);
// app.get('/setup-guide', setupGuide);


// // Add an OPTIONS handler for preflight requests
// app.options('*', cors());

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Email logs available at: http://localhost:${PORT}/api/logs`);
// });


















const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
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
  deleteDuplicateEmails,
  markEmailAsReplied
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

// Automation state management
let automationState = {
  isRunning: false,
  cronJob: null,
  nextSendTime: null,
  config: null,
  resumeFilePath: null,
  totalSent: 0,
  startedAt: null
};

// Improved CORS configuration
app.use(cors({
  origin: ["https://resume-sender.netlify.app",'http://localhost:3000', 'http://localhost:5173', '*'],
  methods: ['GET', 'POST','PUT', 'DELETE','OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// For parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (including automation setup)
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
    if (ext === '.csv' || ext === '.ods' || ext === '.pdf' || ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, ODS, PDF, and DOCX files are allowed'));
    }
  }
});

// Replace your sendAutomatedEmails function with this improved version:

async function sendAutomatedEmails() {
  console.log('🤖 Automation: Starting scheduled email send...');
  
  if (!automationState.config) {
    console.error('❌ Automation: No configuration found');
    return;
  }

  try {
    let mockFile = null;
    
    if (automationState.config.useDefaultResume) {
      // For default resumes, construct the correct path
      const RESUME_PATHS = {
        'frontend': 'naveen_ak_frnt_developer.pdf',
        'backend': 'wit_icon.pdf',
        'fullstack': 'naveen_ak_fullstack.pdf'
      };
      
      const resumeFileName = RESUME_PATHS[automationState.config.selectedResumeKey];
      if (resumeFileName) {
        // Try multiple possible paths
        const possiblePaths = [
          path.join(__dirname, 'public', resumeFileName),
          path.join(__dirname, 'uploads', resumeFileName),
          path.join(process.cwd(), 'public', resumeFileName),
          path.join(process.cwd(), resumeFileName)
        ];
        
        let validPath = null;
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            validPath = testPath;
            console.log(`✅ Found resume at: ${validPath}`);
            break;
          }
        }
        
        if (validPath) {
          try {
            const stats = fs.statSync(validPath);
            mockFile = {
              fieldname: 'resume',
              originalname: resumeFileName,
              encoding: '7bit',
              mimetype: 'application/pdf',
              destination: path.dirname(validPath),
              filename: resumeFileName,
              path: validPath,
              size: stats.size
            };
            console.log(`📎 Resume file prepared: ${resumeFileName} (${stats.size} bytes)`);
          } catch (error) {
            console.error('❌ Error reading default resume stats:', error);
          }
        } else {
          console.error(`❌ Default resume not found: ${resumeFileName}`);
          console.log('Searched paths:', possiblePaths);
        }
      }
    } else if (automationState.resumeFilePath && fs.existsSync(automationState.resumeFilePath)) {
      // Use uploaded resume file
      try {
        const stats = fs.statSync(automationState.resumeFilePath);
        mockFile = {
          fieldname: 'resume',
          originalname: path.basename(automationState.resumeFilePath),
          encoding: '7bit',
          mimetype: 'application/pdf',
          destination: path.dirname(automationState.resumeFilePath),
          filename: path.basename(automationState.resumeFilePath),
          path: automationState.resumeFilePath,
          size: stats.size
        };
        console.log(`📎 Uploaded resume prepared: ${mockFile.originalname} (${stats.size} bytes)`);
      } catch (error) {
        console.error('❌ Error reading uploaded resume:', error);
      }
    }

    // Debug: Log what we're sending
    console.log('🔍 Debug - Email configuration:');
    console.log(`   Subject: ${automationState.config.subject}`);
    console.log(`   Content length: ${automationState.config.content.length} chars`);
    console.log(`   Has resume: ${mockFile ? 'YES' : 'NO'}`);
    if (mockFile) {
      console.log(`   Resume path: ${mockFile.path}`);
      console.log(`   Resume exists: ${fs.existsSync(mockFile.path)}`);
    }

    // Create a mock request object that matches what sendEmailsToAll expects
    const mockReq = {
      body: {
        subject: automationState.config.subject,
        content: automationState.config.content
      },
      file: mockFile,
      headers: {
        'content-type': mockFile ? 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' : 'application/json'
      }
    };

    // Create a mock response object
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 200) {
            console.log('✅ Automation: Emails sent successfully');
            console.log(`📊 Sent: ${data.sentCount}, Failed: ${data.failedCount}, Skipped: ${data.skippedCount}`);
            automationState.totalSent += data.sentCount || 0;
            
            // Schedule next run
            scheduleNextRun();
          } else {
            console.error('❌ Automation: Failed to send emails:', data);
          }
          return data;
        }
      })
    };

    // Call the email sending function
    await sendEmailsToAll(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Automation: Error sending emails:', error);
  }
}

// Also add a debug endpoint to check file paths
apiRouter.get('/debug/files', (req, res) => {
  const debugInfo = {
    currentDirectory: __dirname,
    processDirectory: process.cwd(),
    automationState: {
      isRunning: automationState.isRunning,
      hasConfig: !!automationState.config,
      resumeFilePath: automationState.resumeFilePath,
      config: automationState.config ? {
        useDefaultResume: automationState.config.useDefaultResume,
        selectedResumeKey: automationState.config.selectedResumeKey
      } : null
    },
    fileChecks: {}
  };
  
  // Check for default resume files
  const RESUME_PATHS = {
    'frontend': 'naveen_ak_frnt_developer.pdf',
    'backend': 'wit_icon.pdf',
    'fullstack': 'naveen_ak_fullstack.pdf'
  };
  
  Object.entries(RESUME_PATHS).forEach(([key, filename]) => {
    const possiblePaths = [
      path.join(__dirname, 'public', filename),
      path.join(__dirname, 'uploads', filename),
      path.join(process.cwd(), 'public', filename),
      path.join(process.cwd(), filename)
    ];
    
    debugInfo.fileChecks[key] = {
      filename,
      paths: possiblePaths.map(p => ({
        path: p,
        exists: fs.existsSync(p)
      }))
    };
  });
  
  res.json(debugInfo);
});

// Function to schedule the next email run
function scheduleNextRun() {
  if (automationState.isRunning) {
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 4); // Add 4 hours
    automationState.nextSendTime = nextRun;
    
    console.log(`⏰ Automation: Next email scheduled for ${nextRun.toLocaleString()}`);
  }
}

// Define API router
const apiRouter = express.Router();

// Existing email query routes
apiRouter.get('/emails/paginated', getPaginatedEmails);
apiRouter.put('/api/emails/:id/toggle-status', toggleEmailStatus);
apiRouter.get('/emails/test', getTestEmails);
apiRouter.get('/emails', getAllEmails);
apiRouter.post('/upload', upload.single('file'), uploadFile);
apiRouter.post('/send-emails', sendEmailsToAll);
apiRouter.post('/send-email', sendSingleEmail);
apiRouter.get('/logs', getEmailLogs);
apiRouter.delete('/logs/:id', deleteEmailLog);
apiRouter.delete('/logs', deleteAllEmailLogs);
apiRouter.post('/logs/batch-delete', batchDeleteLogs);
apiRouter.delete('/emails-duplicates', deleteDuplicateEmails);
apiRouter.delete('/emails/:id', deleteEmail);
apiRouter.post('/emails/:emailId/mark-replied', markEmailAsReplied);
apiRouter.delete('/emails-batch', deleteAllEmails);

// NEW AUTOMATION ROUTES

// Get automation status
apiRouter.get('/automation/status', (req, res) => {
  res.json({
    isRunning: automationState.isRunning,
    nextSendTime: automationState.nextSendTime,
    totalSent: automationState.totalSent,
    startedAt: automationState.startedAt,
    config: automationState.config ? {
      subject: automationState.config.subject,
      useDefaultResume: automationState.config.useDefaultResume,
      selectedResumeKey: automationState.config.selectedResumeKey
    } : null
  });
});

// Start automation
apiRouter.post('/automation/start', upload.single('resume'), async (req, res) => {
  try {
    if (automationState.isRunning) {
      return res.status(400).json({ error: 'Automation is already running' });
    }

    // Parse automation data
    const automationData = JSON.parse(req.body.automationData || '{}');
    
    if (!automationData.subject || !automationData.content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // Store configuration
    automationState.config = automationData;
    automationState.startedAt = new Date();
    automationState.totalSent = 0;

    // Handle resume file
    if (req.file) {
      automationState.resumeFilePath = req.file.path;
    } else {
      automationState.resumeFilePath = null;
    }

    // Set up cron job to run every 4 hours
    automationState.cronJob = cron.schedule('0 */4 * * *', sendAutomatedEmails, {
      scheduled: false // Don't start immediately
    });

    // Start the cron job
    automationState.cronJob.start();
    automationState.isRunning = true;

    // Schedule the first run and next runs
    scheduleNextRun();

    // Send first batch immediately (optional - you can remove this if you want to wait 4 hours)
    setTimeout(sendAutomatedEmails, 5000); // Send after 5 seconds

    console.log('🚀 Automation: Email automation started');

    res.json({
      success: true,
      message: 'Email automation started successfully',
      isRunning: true,
      nextSendTime: automationState.nextSendTime,
      config: {
        subject: automationState.config.subject,
        useDefaultResume: automationState.config.useDefaultResume,
        selectedResumeKey: automationState.config.selectedResumeKey
      }
    });

  } catch (error) {
    console.error('Error starting automation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop automation
apiRouter.post('/automation/stop', (req, res) => {
  try {
    if (!automationState.isRunning) {
      return res.status(400).json({ error: 'Automation is not running' });
    }

    // Stop the cron job
    if (automationState.cronJob) {
      automationState.cronJob.stop();
      automationState.cronJob = null;
    }

    // Clean up uploaded resume file if exists
    if (automationState.resumeFilePath && fs.existsSync(automationState.resumeFilePath)) {
      try {
        fs.unlinkSync(automationState.resumeFilePath);
        console.log('🗑️ Cleaned up uploaded resume file');
      } catch (error) {
        console.error('Error deleting resume file:', error);
      }
    }

    // Reset automation state
    const totalSent = automationState.totalSent;
    automationState = {
      isRunning: false,
      cronJob: null,
      nextSendTime: null,
      config: null,
      resumeFilePath: null,
      totalSent: 0,
      startedAt: null
    };

    console.log('🛑 Automation: Email automation stopped');

    res.json({
      success: true,
      message: 'Email automation stopped successfully',
      totalSent: totalSent
    });

  } catch (error) {
    console.error('Error stopping automation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount API router
app.use('/api', apiRouter);

// Add existing routes
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

// Get emails with filter
app.get('/api/emails', async (req, res) => {
  try {
    let query = `SELECT * FROM emails`;
    let conditions = [];
    let values = [];
    let paramIndex = 1;
    
    // Check if replied filter is specified
    if (req.query.replied !== undefined) {
      const repliedValue = req.query.replied === 'true';
      conditions.push(`replied = ${paramIndex}`);
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

// Backward compatibility for direct routes
app.post('/send-emails', sendEmailsToAll);

// System routes
app.get('/health', healthCheck);
app.get('/setup-guide', setupGuide);

// Add an OPTIONS handler for preflight requests
app.options('*', cors());

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT. Gracefully shutting down...');
  
  // Stop automation if running
  if (automationState.isRunning && automationState.cronJob) {
    console.log('🛑 Stopping email automation...');
    automationState.cronJob.stop();
    
    // Clean up uploaded resume file if exists
    if (automationState.resumeFilePath && fs.existsSync(automationState.resumeFilePath)) {
      try {
        fs.unlinkSync(automationState.resumeFilePath);
        console.log('🗑️ Cleaned up uploaded resume file');
      } catch (error) {
        console.error('Error deleting resume file:', error);
      }
    }
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Gracefully shutting down...');
  
  // Stop automation if running
  if (automationState.isRunning && automationState.cronJob) {
    console.log('🛑 Stopping email automation...');
    automationState.cronJob.stop();
    
    // Clean up uploaded resume file if exists
    if (automationState.resumeFilePath && fs.existsSync(automationState.resumeFilePath)) {
      try {
        fs.unlinkSync(automationState.resumeFilePath);
        console.log('🗑️ Cleaned up uploaded resume file');
      } catch (error) {
        console.error('Error deleting resume file:', error);
      }
    }
  }
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email logs available at: http://localhost:${PORT}/api/logs`);
  console.log(`🤖 Automation status available at: http://localhost:${PORT}/api/automation/status`);
  
  // Log automation state on startup
  if (automationState.isRunning) {
    console.log('🤖 Email automation is currently running');
    console.log(`⏰ Next email scheduled for: ${automationState.nextSendTime}`);
  } else {
    console.log('🤖 Email automation is currently stopped');
  }
});
