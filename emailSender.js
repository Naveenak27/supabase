// const nodemailer = require('nodemailer');
// const { supabase, emailStorage } = require('./emailHandlers');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// // Configure multer for resume uploads
// const resumeStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, 'resume_uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const resumeUpload = multer({ 
//   storage: resumeStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const filetypes = /pdf|docx/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Error: Only PDF and DOCX files are allowed!'));
//     }
//   }
// }).single('resume');

// // Create nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

// // Verify transporter configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('SMTP connection error:', error);
//   } else {
//     console.log('SMTP server is ready to send emails');
//   }
// });

// // Function to send email to a single recipient with optional attachment
// const sendEmail = async (recipient, subject, html, attachmentPath = null) => {
//   const mailOptions = {
//     from: process.env.SMTP_USER,
//     to: recipient,
//     subject: subject,
//     html: html,
//   };

//   // Add attachment if provided
//   if (attachmentPath && fs.existsSync(attachmentPath)) {
//     mailOptions.attachments = [{
//       filename: path.basename(attachmentPath),
//       path: attachmentPath
//     }];
//   }

//   return transporter.sendMail(mailOptions);
// };

// // Log email sending result to database
// const logEmailResult = async (email, subject, status, errorMessage = null) => {
//   try {
//     const timestamp = new Date().toISOString();
//     const logEntry = {
//       email,
//       subject,
//       status, // 'success' or 'failed'
//       error_message: errorMessage,
//       sent_at: timestamp
//     };

//     // Store log in Supabase
//     const { data, error } = await supabase
//       .from('email_logs')
//       .insert([logEntry]);
    
//     if (error) {
//       console.error('Failed to log email result to database:', error);
      
//       // Fallback to in-memory storage if database fails
//       if (!global.emailLogs) {
//         global.emailLogs = [];
//       }
//       global.emailLogs.push(logEntry);
//     }
    
//     return logEntry;
//   } catch (error) {
//     console.error('Error logging email result:', error);
//     return null;
//   }
// };

// // Process the request with multer file upload middleware
// const processFileUpload = (req, res) => {
//   return new Promise((resolve, reject) => {
//     resumeUpload(req, res, (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve();
//       }
//     });
//   });
// };

// // Check if email has already been sent successfully
// const checkIfEmailAlreadySent = async (email, subject) => {
//   try {
//     // Check database first
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .eq('email', email)
//       .eq('subject', subject)
//       .eq('status', 'success')
//       .limit(1);
    
//     if (error) {
//       console.error('Error checking email log:', error);
      
//       // Fallback to in-memory logs if database fails
//       if (global.emailLogs) {
//         const found = global.emailLogs.find(log => 
//           log.email === email && 
//           log.subject === subject && 
//           log.status === 'success'
//         );
//         return !!found;
//       }
//       return false;
//     }
    
//     // If we found a successful log entry, this email has already been sent
//     return data && data.length > 0;
    
//   } catch (error) {
//     console.error('Error checking if email was already sent:', error);
//     return false;
//   }
// };









// // Get email logs from database
// // const getEmailLogs = async (req, res) => {
// //   try {
// //     // Try to get logs from database first
// //     const { data, error } = await supabase
// //       .from('email_logs')
// //       .select('*')
// //       .order('sent_at', { ascending: false })
// //       .limit(3000);
    
// //     if (error) {
// //       console.error('Error fetching email logs:', error);
// //       // If database fails, return in-memory logs if available
// //       const memoryLogs = global.emailLogs || [];
      
// //       // Extract successful and skipped emails from memory logs
// //       const successfulEmails = memoryLogs
// //         .filter(log => log.status === 'success')
// //         .map(log => log.email);
      
// //       const skippedEmails = memoryLogs
// //         .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
// //         .map(log => log.email);
      
// //       return res.status(200).json({
// //         success: true,
// //         data: memoryLogs,
// //         successfulEmails,
// //         skippedEmails,
// //         source: 'memory'
// //       });
// //     }
    
// //     // Extract successful and skipped emails from database logs
// //     const successfulEmails = data
// //       .filter(log => log.status === 'success')
// //       .map(log => log.email);
    
// //     const skippedEmails = data
// //       .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
// //       .map(log => log.email);
    
// //     return res.status(200).json({
// //       success: true,
// //       data: data,
// //       successfulEmails,
// //       skippedEmails,
// //       source: 'database'
// //     });
// //   } catch (error) {
// //     console.error('Server error fetching logs:', error);
// //     return res.status(500).json({
// //       success: false,
// //       error: `Server error: ${error.message}`
// //     });
// //   }
// // };



// const getEmailLogs = async (req, res) => {
//   try {
//     // Try to get logs from database first
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .order('sent_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching email logs:', error);
//       // If database fails, return in-memory logs if available
//       const memoryLogs = global.emailLogs || [];

//       // Extract successful and skipped emails from memory logs
//       const successfulEmails = memoryLogs
//         .filter(log => log.status === 'success')
//         .map(log => log.email);

//       const skippedEmails = memoryLogs
//         .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//         .map(log => log.email);

//       return res.status(200).json({
//         success: true,
//         data: memoryLogs,
//         successfulEmails,
//         skippedEmails,
//         source: 'memory'
//       });
//     }

//     // Extract successful and skipped emails from database logs
//     const successfulEmails = data
//       .filter(log => log.status === 'success')
//       .map(log => log.email);

//     const skippedEmails = data
//       .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//       .map(log => log.email);

//     return res.status(200).json({
//       success: true,
//       data: data,
//       successfulEmails,
//       skippedEmails,
//       source: 'database'
//     });
//   } catch (error) {
//     console.error('Server error fetching logs:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };




















// // Controller for sending emails to all recipients in DB
// // const sendEmailsToAll = async (req, res) => {
// //   try {
// //     // First, process any file upload (resume)
// //     try {
// //       await processFileUpload(req, res);
// //     } catch (uploadError) {
// //       return res.status(400).json({
// //         success: false,
// //         error: `File upload error: ${uploadError.message}`
// //       });
// //     }

// //     // Get data from request (could be JSON or form data)
// //     const emailSubject = req.body.subject;
// //     const emailContent = req.body.content;
    
// //     // Validate required fields
// //     if (!emailSubject || !emailContent) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Email subject and content are required'
// //       });
// //     }

// //     // Get the resume file path (if any)
// //     const resumePath = req.file ? req.file.path : null;

// //     // Get all ACTIVE emails from database or memory (only where active = 1)
// //     let emails = [];
// //     try {
// //       const { data, error } = await supabase
// //         .from('emails')
// //         .select('email')
// //         .eq('active', 1); // Only select emails where active = 1
      
// //       if (error && error.code === '42P01') {
// //         // Table doesn't exist, use in-memory data but filter by active status
// //         emails = emailStorage
// //           .filter(item => item.active === 1) // Only include active emails
// //           .map(item => item.email);
// //       } else if (error) {
// //         throw error;
// //       } else {
// //         // Database data
// //         emails = data.map(item => item.email);
// //       }
// //     } catch (dbError) {
// //       console.error('Database error:', dbError);
// //       return res.status(500).json({
// //         success: false,
// //         error: `Database error: ${dbError.message}`
// //       });
// //     }

// //     if (emails.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'No active emails found to send to'
// //       });
// //     }

// //     console.log(`Preparing to send emails to ${emails.length} active recipients`);
// //     console.log(`Email subject: ${emailSubject}`);
// //     console.log(`Email content: ${emailContent.substring(0, 100)}...`);
// //     if (resumePath) {
// //       console.log(`Attaching resume: ${resumePath}`);
// //     }

// //     // Track results
// //     const results = { 
// //       success: [], 
// //       failed: [],
// //       skipped: [] // Track skipped emails
// //     };
    
// //     // Track campaign for logs
// //     const campaignId = Date.now().toString();
    
// //     // Process each email - check if already sent first, then send if needed
// //     for (let i = 0; i < emails.length; i++) {
// //       const email = emails[i];
      
// //       // Check if this email + subject combination was already sent successfully
// //       const alreadySent = await checkIfEmailAlreadySent(email, emailSubject);
      
// //       if (alreadySent) {
// //         // Skip this email as it was already sent successfully
// //         console.log(`⏭️ Skipping email to ${email}: already sent successfully`);
// //         results.skipped.push(email);
// //         // Log that we skipped this email
// //         await logEmailResult(email, emailSubject, 'skipped', 'Email already sent successfully');
// //         continue; // Skip to the next email
// //       }
      
// //       try {
// //         // Send the email
// //         await sendEmail(email, emailSubject, emailContent, resumePath);
// //         results.success.push(email);
// //         console.log(`✅ Email sent successfully to: ${email}`);
// //         // Log successful email
// //         await logEmailResult(email, emailSubject, 'success');
// //       } catch (error) {
// //         console.error(`❌ Failed to send email to ${email}:`, error.message);
// //         results.failed.push({ email, error: error.message });
// //         // Log failed email
// //         await logEmailResult(email, emailSubject, 'failed', error.message);
// //       }
      
      
// //       // Add a delay after each email (except the last one)
// //       if (i < emails.length - 1) {
// //         console.log(`Waiting 35 seconds before sending the next email...`);
// //         await new Promise(resolve => setTimeout(resolve, 192000)); // 2000ms = 2 seconds
// //       }
// //     }

// //     // Log the campaign summary
// //     await logEmailResult(
// //       process.env.SMTP_USER, 
// //       `Campaign Summary: ${emailSubject}`,
// //       'campaign_summary', 
// //       JSON.stringify({
// //         campaignId,
// //         totalEmails: emails.length,
// //         successful: results.success.length,
// //         failed: results.failed.length,
// //         skipped: results.skipped.length
// //       })
// //     );

// //     // Clean up the resume file after sending if it exists
// //     if (resumePath && fs.existsSync(resumePath)) {
// //       try {
// //         fs.unlinkSync(resumePath);
// //         console.log(`Deleted temporary file: ${resumePath}`);
// //       } catch (deleteError) {
// //         console.error(`Error deleting file: ${deleteError.message}`);
// //       }
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       sentCount: results.success.length,
// //       failedCount: results.failed.length,
// //       skippedCount: results.skipped.length,
// //       totalAttempted: emails.length,
// //       campaignId,
// //       failedEmails: results.failed.length > 0 ? results.failed : undefined,
// //       skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
// //     });
    
// //   } catch (error) {
// //     console.error('Server error:', error);
// //     return res.status(500).json({
// //       success: false,
// //       error: `Server error: ${error.message}`
// //     });
// //   }
// // };


// const sendEmailsToAll = async (req, res) => {
//   try {
//     // First, process any file upload (resume)
//     try {
//       await processFileUpload(req, res);
//     } catch (uploadError) {
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${uploadError.message}`
//       });
//     }

//     // Get data from request (could be JSON or form data)
//     const emailSubject = req.body.subject;
//     const emailContent = req.body.content;
    
//     // Validate required fields
//     if (!emailSubject || !emailContent) {
//       return res.status(400).json({
//         success: false,
//         error: 'Email subject and content are required'
//       });
//     }

//     // Get the resume file path (if any)
//     const resumePath = req.file ? req.file.path : null;

//     // Get all ACTIVE emails from database or memory (only where active = 1)
//     let emails = [];
//     try {
//       const { data, error } = await supabase
//         .from('emails')
//         .select('email')
//         .eq('active', 1); // Only select emails where active = 1
      
//       if (error && error.code === '42P01') {
//         // Table doesn't exist, use in-memory data but filter by active status
//         emails = emailStorage
//           .filter(item => item.active === 1) // Only include active emails
//           .map(item => item.email);
//       } else if (error) {
//         throw error;
//       } else {
//         // Database data
//         emails = data.map(item => item.email);
//       }
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }

//     if (emails.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No active emails found to send to'
//       });
//     }

//     console.log(`Preparing to send emails to ${emails.length} active recipients`);
//     console.log(`Email subject: ${emailSubject}`);
//     console.log(`Email content: ${emailContent.substring(0, 100)}...`);
//     if (resumePath) {
//       console.log(`Attaching resume: ${resumePath}`);
//     }

//     // Track results
//     const results = { 
//       success: [], 
//       failed: [],
//       skipped: [] // Track skipped emails
//     };
    
//     // Track campaign for logs
//     const campaignId = Date.now().toString();
    
//     // Function to generate random delay between 3-4 minutes
//     const getRandomDelay = () => {
//       // 3 minutes = 180,000ms, 4 minutes = 240,000ms
//       const minDelay = 180000; // 3 minutes in milliseconds
//       const maxDelay = 240000; // 4 minutes in milliseconds
//       return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
//     };
    
//     // Process each email - check if already sent first, then send if needed
//     for (let i = 0; i < emails.length; i++) {
//       const email = emails[i];
      
//       // Check if this email + subject combination was already sent successfully
//       const alreadySent = await checkIfEmailAlreadySent(email, emailSubject);
      
//       if (alreadySent) {
//         // Skip this email as it was already sent successfully
//         console.log(`⏭️ Skipping email to ${email}: already sent successfully`);
//         results.skipped.push(email);
//         // Log that we skipped this email
//         await logEmailResult(email, emailSubject, 'skipped', 'Email already sent successfully');
//         continue; // Skip to the next email
//       }
      
//       try {
//         // Send the email
//         await sendEmail(email, emailSubject, emailContent, resumePath);
//         results.success.push(email);
//         console.log(`✅ Email sent successfully to: ${email}`);
//         // Log successful email
//         await logEmailResult(email, emailSubject, 'success');
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${email}:`, error.message);
//         results.failed.push({ email, error: error.message });
//         // Log failed email
//         await logEmailResult(email, emailSubject, 'failed', error.message);
//       }
      
//       // Add a random delay after each email (except the last one)
//       if (i < emails.length - 1) {
//         const delayMs = getRandomDelay();
//         const delayMinutes = (delayMs / 60000).toFixed(1); // Convert to minutes for display
//         console.log(`Waiting ${delayMinutes} minutes (${delayMs}ms) before sending the next email...`);
//         await new Promise(resolve => setTimeout(resolve, delayMs));
//       }
//     }

//     // Log the campaign summary
//     await logEmailResult(
//       process.env.SMTP_USER, 
//       `Campaign Summary: ${emailSubject}`,
//       'campaign_summary', 
//       JSON.stringify({
//         campaignId,
//         totalEmails: emails.length,
//         successful: results.success.length,
//         failed: results.failed.length,
//         skipped: results.skipped.length
//       })
//     );

//     // Clean up the resume file after sending if it exists
//     if (resumePath && fs.existsSync(resumePath)) {
//       try {
//         fs.unlinkSync(resumePath);
//         console.log(`Deleted temporary file: ${resumePath}`);
//       } catch (deleteError) {
//         console.error(`Error deleting file: ${deleteError.message}`);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       sentCount: results.success.length,
//       failedCount: results.failed.length,
//       skippedCount: results.skipped.length,
//       totalAttempted: emails.length,
//       campaignId,
//       failedEmails: results.failed.length > 0 ? results.failed : undefined,
//       skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
//     });
    
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };





// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, 'uploads');
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     // Create a unique filename
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB file size limit
//   },
//   fileFilter: (req, file, cb) => {
//     // Accept only PDF and Word documents
//     if (
//       file.mimetype === 'application/pdf' || 
//       file.mimetype === 'application/msword' || 
//       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF and Word documents are allowed'));
//     }
//   }
// });

// // Define the middleware to handle file uploads
// const uploadMiddleware = upload.single('file');
















// // Controller for sending an email to a single recipient
// const sendSingleEmail = async (req, res) => {
//   // First handle file upload using multer middleware
//   uploadMiddleware(req, res, async (err) => {
//     if (err) {
//       console.error('File upload error:', err);
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${err.message}`
//       });
//     }

//     try {
//       // Get resume path if a file was uploaded
//       let resumePath = null;
//       if (req.file) {
//         resumePath = req.file.path;
//         console.log(`File uploaded successfully to: ${resumePath}`);
//       }

//       // Get data from request
//       const { subject, content, recipients: recipientsInput } = req.body;
      
//       // Log the received data for debugging
//       console.log('Received form data:', {
//         subject,
//         content,
//         recipientsInput
//       });

//       // Parse recipients if it's a string
//       let recipients;
//       if (typeof recipientsInput === 'string') {
//         try {
//           recipients = JSON.parse(recipientsInput);
//         } catch (e) {
//           recipients = [recipientsInput]; // Fallback to treating it as a single email
//         }
//       } else {
//         recipients = recipientsInput;
//       }

//       // Validate required fields
//       if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
//         // Clean up the file if validation fails
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
        
//         return res.status(400).json({
//           success: false,
//           error: 'Email subject, content, and at least one recipient are required'
//         });
//       }

//       // Use the first recipient (or process all if needed)
//       const recipient = recipients[0];
//       console.log(`Preparing to send email to: ${recipient}`);
//       console.log(`Email subject: ${subject}`);
//       console.log(`Email content: ${content.substring(0, 100)}...`);

//       try {
//         // Check if this email has already been sent with this subject
//         const alreadySent = await checkIfEmailAlreadySent(recipient, subject);
//         if (alreadySent) {
//           console.log(`⏭️ Skipping email to ${recipient}: already sent successfully`);
          
//           // Clean up the file if skipping
//           if (resumePath && fs.existsSync(resumePath)) {
//             fs.unlinkSync(resumePath);
//           }
          
//           return res.status(200).json({
//             success: true,
//             message: `Email to ${recipient} was already sent successfully`,
//             status: 'skipped'
//           });
//         }

//         // Send the email
//         await sendEmail(recipient, subject, content, resumePath);
        
//         // Log successful email
//         await logEmailResult(recipient, subject, 'success');
//         console.log(`✅ Email sent successfully to: ${recipient}`);
        
//         // Clean up the resume file after sending if it exists
//         if (resumePath && fs.existsSync(resumePath)) {
//           try {
//             fs.unlinkSync(resumePath);
//             console.log(`Deleted temporary file: ${resumePath}`);
//           } catch (deleteError) {
//             console.error(`Error deleting file: ${deleteError.message}`);
//           }
//         }
        
//         return res.status(200).json({
//           success: true,
//           message: `Email sent successfully to ${recipient}`
//         });
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${recipient}:`, error.message);
        
//         // Log failed email
//         await logEmailResult(recipient, subject, 'failed', error.message);
        
//         // Clean up the file if sending fails
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
        
//         return res.status(500).json({
//           success: false,
//           error: `Failed to send email: ${error.message}`
//         });
//       }
//     } catch (error) {
//       console.error('Server error:', error);
      
//       // Clean up any uploaded file on server error
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
      
//       return res.status(500).json({
//         success: false,
//         error: `Server error: ${error.message}`
//       });
//     }
//   });
// };

// // Add these functions to the bottom of your emailSender.js file before the module.exports

// // Delete a single email log
// const deleteEmailLog = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Delete from database
//     const { error } = await supabase
//       .from('email_logs')
//       .delete()
//       .eq('id', id);
    
//     if (error) {
//       console.error('Error deleting email log:', error);
      
//       // Fallback to in-memory deletion if database fails
//       if (global.emailLogs) {
//         const index = global.emailLogs.findIndex(log => log.id === id);
//         if (index !== -1) {
//           global.emailLogs.splice(index, 1);
//           return res.status(200).json({
//             success: true,
//             message: 'Log deleted successfully from memory'
//           });
//         }
//       }
      
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${error.message}`
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: 'Log deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Delete all email logs
// const deleteAllEmailLogs = async (req, res) => {
//   try {
//     console.log('Starting deletion of all email logs...');
    
//     // Use Supabase's most reliable approach - execute a raw SQL query
//     const { data, error } = await supabase.rpc('truncate_email_logs');
    
//     if (error) {
//       console.error('Error deleting all email logs:', error);
      
//       // Fallback approach if the RPC function isn't available
//       const { error: deleteError } = await supabase
//         .from('email_logs')
//         .delete();
      
//       if (deleteError) {
//         console.error('Fallback deletion also failed:', deleteError);
//         return res.status(500).json({
//           success: false,
//           error: `Could not delete logs: ${deleteError.message}`
//         });
//       }
//     }
    
//     // Clear in-memory logs as well to ensure consistency
//     if (global.emailLogs) {
//       global.emailLogs = [];
//     }
    
//     console.log('Successfully deleted all email logs');
    
//     return res.status(200).json({
//       success: true,
//       message: 'All email logs deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error during log deletion:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// const batchDeleteLogs = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid array of email log IDs is required'
//       });
//     }
    
//     try {
//       // Delete from database
//       const { error } = await supabase
//         .from('email_logs')
//         .delete()
//         .in('id', ids);
      
//       if (error) {
//         if (error.code === '42P01') {
//           // Table doesn't exist, use in-memory storage if available
//           // Since there's no emailLogsStorage defined in your code, we'll return an appropriate message
          
//           return res.status(404).json({
//             success: false,
//             error: 'Email logs table does not exist and in-memory storage is not initialized',
//             suggestion: 'Create an email_logs table in your database'
//           });
//         } else {
//           // Other database error
//           throw error;
//         }
//       }
      
//       // Successfully deleted from database
//       return res.status(200).json({
//         success: true,
//         message: `${ids.length} email logs deleted successfully`,
//         source: 'database'
//       });
      
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };
// // Update your module.exports to include the new functions
// module.exports = {
//   sendEmailsToAll,
//   sendSingleEmail,
//   getEmailLogs,
//   deleteEmailLog,
//   deleteAllEmailLogs,    batchDeleteLogs   // Add this new export

// };


// // emailSender.js



// Replaced Nodemailer SMTP with Brevo TransactionalEmailsApi

// const { supabase, emailStorage } = require('./emailHandlers');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// console.log('Environment loaded:', {
//   hasApiKey: !!process.env.BREVO_API_KEY,
//   hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL
// });


// const Brevo = require('@getbrevo/brevo');

// // Create instance
// const brevoApi = new Brevo.TransactionalEmailsApi();

// // Set authentication - try this method first
// brevoApi.setApiKey(
//   Brevo.TransactionalEmailsApiApiKeys.apiKey, 
//   process.env.BREVO_API_KEY
// );


// // Helper to build Brevo attachment from a file path (base64)
// const fileToBase64Attachment = (attachmentPath) => {
//   const content = fs.readFileSync(attachmentPath).toString('base64');
//   return {
//     name: path.basename(attachmentPath),
//     content, // base64 string
//   };
// };

// // Configure multer for resume uploads
// const resumeStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, 'resume_uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const resumeUpload = multer({ 
//   storage: resumeStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const filetypes = /pdf|docx/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Error: Only PDF and DOCX files are allowed!'));
//     }
//   }
// }).single('resume');

// // Function to send email to a single recipient with optional attachment via Brevo
// const sendEmail = async (recipient, subject, html, attachmentPath = null) => {
//   const sendSmtpEmail = new Brevo.SendSmtpEmail();

//   sendSmtpEmail.subject = subject;
//   sendSmtpEmail.htmlContent = html;
//   sendSmtpEmail.sender = {
//     email: process.env.BREVO_SENDER_EMAIL,
//     name: process.env.BREVO_SENDER_NAME || undefined,
//   };
//   sendSmtpEmail.to = [{ email: recipient }];

//   if (attachmentPath && fs.existsSync(attachmentPath)) {
//     sendSmtpEmail.attachment = [fileToBase64Attachment(attachmentPath)];
//   }

//   // Send through Brevo Transactional Email API
//   // Returns a promise resolving with API response (contains messageId, etc.)
//   return brevoApi.sendTransacEmail(sendSmtpEmail);
// };

// // Log email sending result to database
// const logEmailResult = async (email, subject, status, errorMessage = null) => {
//   try {
//     const timestamp = new Date().toISOString();
//     const logEntry = {
//       email,
//       subject,
//       status, // 'success' or 'failed' or 'skipped' or 'campaign_summary'
//       error_message: errorMessage,
//       sent_at: timestamp
//     };

//     const { data, error } = await supabase
//       .from('email_logs')
//       .insert([logEntry]);
    
//     if (error) {
//       console.error('Failed to log email result to database:', error);
//       if (!global.emailLogs) {
//         global.emailLogs = [];
//       }
//       global.emailLogs.push(logEntry);
//     }
    
//     return logEntry;
//   } catch (error) {
//     console.error('Error logging email result:', error);
//     return null;
//   }
// };

// // Process the request with multer file upload middleware
// const processFileUpload = (req, res) => {
//   return new Promise((resolve, reject) => {
//     resumeUpload(req, res, (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve();
//       }
//     });
//   });
// };

// // Check if email has already been sent successfully
// const checkIfEmailAlreadySent = async (email, subject) => {
//   try {
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .eq('email', email)
//       .eq('subject', subject)
//       .eq('status', 'success')
//       .limit(1);
    
//     if (error) {
//       console.error('Error checking email log:', error);
//       if (global.emailLogs) {
//         const found = global.emailLogs.find(log => 
//           log.email === email && 
//           log.subject === subject && 
//           log.status === 'success'
//         );
//         return !!found;
//       }
//       return false;
//     }
    
//     return data && data.length > 0;
    
//   } catch (error) {
//     console.error('Error checking if email was already sent:', error);
//     return false;
//   }
// };

// const getEmailLogs = async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .order('sent_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching email logs:', error);
//       const memoryLogs = global.emailLogs || [];

//       const successfulEmails = memoryLogs
//         .filter(log => log.status === 'success')
//         .map(log => log.email);

//       const skippedEmails = memoryLogs
//         .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//         .map(log => log.email);

//       return res.status(200).json({
//         success: true,
//         data: memoryLogs,
//         successfulEmails,
//         skippedEmails,
//         source: 'memory'
//       });
//     }

//     const successfulEmails = data
//       .filter(log => log.status === 'success')
//       .map(log => log.email);

//     const skippedEmails = data
//       .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//       .map(log => log.email);

//     return res.status(200).json({
//       success: true,
//       data: data,
//       successfulEmails,
//       skippedEmails,
//       source: 'database'
//     });
//   } catch (error) {
//     console.error('Server error fetching logs:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Controller for sending emails to all recipients in DB
// const sendEmailsToAll = async (req, res) => {
//   try {
//     // First, process any file upload (resume)
//     try {
//       await processFileUpload(req, res);
//     } catch (uploadError) {
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${uploadError.message}`
//       });
//     }

//     const emailSubject = req.body.subject;
//     const emailContent = req.body.content;
    
//     if (!emailSubject || !emailContent) {
//       return res.status(400).json({
//         success: false,
//         error: 'Email subject and content are required'
//       });
//     }

//     const resumePath = req.file ? req.file.path : null;

//     // Get all ACTIVE emails
//     let emails = [];
//     try {
//       const { data, error } = await supabase
//         .from('emails')
//         .select('email')
//         .eq('active', 1);
      
//       if (error && error.code === '42P01') {
//         emails = emailStorage
//           .filter(item => item.active === 1)
//           .map(item => item.email);
//       } else if (error) {
//         throw error;
//       } else {
//         emails = data.map(item => item.email);
//       }
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }

//     if (emails.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No active emails found to send to'
//       });
//     }

//     console.log(`Preparing to send emails to ${emails.length} active recipients`);
//     console.log(`Email subject: ${emailSubject}`);
//     console.log(`Email content: ${emailContent.substring(0, 100)}...`);
//     if (resumePath) {
//       console.log(`Attaching resume: ${resumePath}`);
//     }

//     const results = { 
//       success: [], 
//       failed: [],
//       skipped: []
//     };
    
//     const campaignId = Date.now().toString();
    
// const getRandomDelay = () => {
//   const minDelay = 420000; // 7 min
//   const maxDelay = 600000; // 10 min
//   return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
// };

    
//     for (let i = 0; i < emails.length; i++) {
//       const email = emails[i];
      
//       const alreadySent = await checkIfEmailAlreadySent(email, emailSubject);
//       if (alreadySent) {
//         console.log(`⏭️ Skipping email to ${email}: already sent successfully`);
//         results.skipped.push(email);
//         await logEmailResult(email, emailSubject, 'skipped', 'Email already sent successfully');
//         continue;
//       }
      
//       try {
//         await sendEmail(email, emailSubject, emailContent, resumePath);
//         results.success.push(email);
//         console.log(`✅ Email sent successfully to: ${email}`);
//         await logEmailResult(email, emailSubject, 'success');
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${email}:`, error.message);
//         results.failed.push({ email, error: error.message });
//         await logEmailResult(email, emailSubject, 'failed', error.message);
//       }
      
//       if (i < emails.length - 1) {
//         const delayMs = getRandomDelay();
//         const delayMinutes = (delayMs / 60000).toFixed(1);
//         console.log(`Waiting ${delayMinutes} minutes (${delayMs}ms) before sending the next email...`);
//         await new Promise(resolve => setTimeout(resolve, delayMs));
//       }
//     }

//     await logEmailResult(
//       process.env.BREVO_SENDER_EMAIL, 
//       `Campaign Summary: ${emailSubject}`,
//       'campaign_summary', 
//       JSON.stringify({
//         campaignId,
//         totalEmails: emails.length,
//         successful: results.success.length,
//         failed: results.failed.length,
//         skipped: results.skipped.length
//       })
//     );

//     if (resumePath && fs.existsSync(resumePath)) {
//       try {
//         fs.unlinkSync(resumePath);
//         console.log(`Deleted temporary file: ${resumePath}`);
//       } catch (deleteError) {
//         console.error(`Error deleting file: ${deleteError.message}`);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       sentCount: results.success.length,
//       failedCount: results.failed.length,
//       skippedCount: results.skipped.length,
//       totalAttempted: emails.length,
//       campaignId,
//       failedEmails: results.failed.length > 0 ? results.failed : undefined,
//       skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
//     });
    
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Secondary multer storage for single email upload endpoint
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB
//   },
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype === 'application/pdf' || 
//       file.mimetype === 'application/msword' || 
//       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF and Word documents are allowed'));
//     }
//   }
// });

// const uploadMiddleware = upload.single('file');

// // Controller for sending an email to a single recipient
// const sendSingleEmail = async (req, res) => {
//   uploadMiddleware(req, res, async (err) => {
//     if (err) {
//       console.error('File upload error:', err);
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${err.message}`
//       });
//     }

//     try {
//       let resumePath = null;
//       if (req.file) {
//         resumePath = req.file.path;
//         console.log(`File uploaded successfully to: ${resumePath}`);
//       }

//       const { subject, content, recipients: recipientsInput } = req.body;
//       console.log('Received form data:', {
//         subject,
//         content,
//         recipientsInput
//       });

//       let recipients;
//       if (typeof recipientsInput === 'string') {
//         try {
//           recipients = JSON.parse(recipientsInput);
//         } catch (e) {
//           recipients = [recipientsInput];
//         }
//       } else {
//         recipients = recipientsInput;
//       }

//       if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
//         return res.status(400).json({
//           success: false,
//           error: 'Email subject, content, and at least one recipient are required'
//         });
//       }

//       const recipient = recipients[0];
//       console.log(`Preparing to send email to: ${recipient}`);
//       console.log(`Email subject: ${subject}`);
//       console.log(`Email content: ${content.substring(0, 100)}...`);

//       try {
//         const alreadySent = await checkIfEmailAlreadySent(recipient, subject);
//         if (alreadySent) {
//           console.log(`⏭️ Skipping email to ${recipient}: already sent successfully`);
//           if (resumePath && fs.existsSync(resumePath)) {
//             fs.unlinkSync(resumePath);
//           }
          
//           return res.status(200).json({
//             success: true,
//             message: `Email to ${recipient} was already sent successfully`,
//             status: 'skipped'
//           });
//         }

//         await sendEmail(recipient, subject, content, resumePath);
//         await logEmailResult(recipient, subject, 'success');
//         console.log(`✅ Email sent successfully to: ${recipient}`);
        
//         if (resumePath && fs.existsSync(resumePath)) {
//           try {
//             fs.unlinkSync(resumePath);
//             console.log(`Deleted temporary file: ${resumePath}`);
//           } catch (deleteError) {
//             console.error(`Error deleting file: ${deleteError.message}`);
//           }
//         }
        
//         return res.status(200).json({
//           success: true,
//           message: `Email sent successfully to ${recipient}`
//         });
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${recipient}:`, error.message);
//         await logEmailResult(recipient, subject, 'failed', error.message);
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
//         return res.status(500).json({
//           success: false,
//           error: `Failed to send email: ${error.message}`
//         });
//       }
//     } catch (error) {
//       console.error('Server error:', error);
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(500).json({
//         success: false,
//         error: `Server error: ${error.message}`
//       });
//     }
//   });
// };

// // Delete a single email log
// const deleteEmailLog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { error } = await supabase
//       .from('email_logs')
//       .delete()
//       .eq('id', id);
    
//     if (error) {
//       console.error('Error deleting email log:', error);
//       if (global.emailLogs) {
//         const index = global.emailLogs.findIndex(log => log.id === id);
//         if (index !== -1) {
//           global.emailLogs.splice(index, 1);
//           return res.status(200).json({
//             success: true,
//             message: 'Log deleted successfully from memory'
//           });
//         }
//       }
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${error.message}`
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: 'Log deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Delete all email logs
// const deleteAllEmailLogs = async (req, res) => {
//   try {
//     console.log('Starting deletion of all email logs...');
//     const { data, error } = await supabase.rpc('truncate_email_logs');
    
//     if (error) {
//       console.error('Error deleting all email logs:', error);
//       const { error: deleteError } = await supabase.from('email_logs').delete();
//       if (deleteError) {
//         console.error('Fallback deletion also failed:', deleteError);
//         return res.status(500).json({
//           success: false,
//           error: `Could not delete logs: ${deleteError.message}`
//         });
//       }
//     }
    
//     if (global.emailLogs) {
//       global.emailLogs = [];
//     }
    
//     console.log('Successfully deleted all email logs');
//     return res.status(200).json({
//       success: true,
//       message: 'All email logs deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error during log deletion:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// const batchDeleteLogs = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid array of email log IDs is required'
//       });
//     }
    
//     try {
//       const { error } = await supabase
//         .from('email_logs')
//         .delete()
//         .in('id', ids);
      
//       if (error) {
//         if (error.code === '42P01') {
//           return res.status(404).json({
//             success: false,
//             error: 'Email logs table does not exist and in-memory storage is not initialized',
//             suggestion: 'Create an email_logs table in your database'
//           });
//         } else {
//           throw error;
//         }
//       }
      
//       return res.status(200).json({
//         success: true,
//         message: `${ids.length} email logs deleted successfully`,
//         source: 'database'
//       });
      
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// module.exports = {
//   sendEmailsToAll,
//   sendSingleEmail,
//   getEmailLogs,
//   deleteEmailLog,
//   deleteAllEmailLogs,
//   batchDeleteLogs
// };


// const { supabase, emailStorage } = require('./emailHandlers');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// console.log('Environment loaded:', {
//   hasApiKey: !!process.env.BREVO_API_KEY,
//   hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL
// });

// // Initialize Brevo (Sendinblue)
// const SibApiV3Sdk = require('sib-api-v3-sdk');
// const defaultClient = SibApiV3Sdk.ApiClient.instance;
// const apiKey = defaultClient.authentications['api-key'];
// apiKey.apiKey = process.env.BREVO_API_KEY;

// const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// // Helper to build Brevo attachment from a file path (base64)
// const fileToBase64Attachment = (attachmentPath) => {
//   const content = fs.readFileSync(attachmentPath).toString('base64');
//   const extname = path.extname(attachmentPath).toLowerCase();
  
//   return {
//     content: content,
//     name: path.basename(attachmentPath)
//   };
// };

// // Configure multer for resume uploads
// const resumeStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, 'resume_uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const resumeUpload = multer({ 
//   storage: resumeStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const filetypes = /pdf|docx/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Error: Only PDF and DOCX files are allowed!'));
//     }
//   }
// }).single('resume');

// // Function to send email to a single recipient with optional attachment via Brevo
// const sendEmail = async (recipient, subject, html, attachmentPath = null) => {
//   const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
//   sendSmtpEmail.sender = {
//     email: process.env.BREVO_SENDER_EMAIL,
//     name: process.env.BREVO_SENDER_NAME || undefined
//   };
  
//   sendSmtpEmail.to = [{ email: recipient }];
//   sendSmtpEmail.subject = subject;
//   sendSmtpEmail.htmlContent = html;

//   // Add attachment if provided
//   if (attachmentPath && fs.existsSync(attachmentPath)) {
//     sendSmtpEmail.attachment = [fileToBase64Attachment(attachmentPath)];
//   }

//   // Send through Brevo API
//   return await apiInstance.sendTransacEmail(sendSmtpEmail);
// };

// // Log email sending result to database
// const logEmailResult = async (email, subject, status, errorMessage = null) => {
//   try {
//     const timestamp = new Date().toISOString();
//     const logEntry = {
//       email,
//       subject,
//       status, // 'success' or 'failed' or 'skipped' or 'campaign_summary'
//       error_message: errorMessage,
//       sent_at: timestamp
//     };

//     const { data, error } = await supabase
//       .from('email_logs')
//       .insert([logEntry]);
    
//     if (error) {
//       console.error('Failed to log email result to database:', error);
//       if (!global.emailLogs) {
//         global.emailLogs = [];
//       }
//       global.emailLogs.push(logEntry);
//     }
    
//     return logEntry;
//   } catch (error) {
//     console.error('Error logging email result:', error);
//     return null;
//   }
// };

// // Process the request with multer file upload middleware
// const processFileUpload = (req, res) => {
//   return new Promise((resolve, reject) => {
//     resumeUpload(req, res, (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve();
//       }
//     });
//   });
// };

// // Check if email has already been sent successfully
// const checkIfEmailAlreadySent = async (email, subject) => {
//   try {
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .eq('email', email)
//       .eq('subject', subject)
//       .eq('status', 'success')
//       .limit(1);
    
//     if (error) {
//       console.error('Error checking email log:', error);
//       if (global.emailLogs) {
//         const found = global.emailLogs.find(log => 
//           log.email === email && 
//           log.subject === subject && 
//           log.status === 'success'
//         );
//         return !!found;
//       }
//       return false;
//     }
    
//     return data && data.length > 0;
    
//   } catch (error) {
//     console.error('Error checking if email was already sent:', error);
//     return false;
//   }
// };

// const getEmailLogs = async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .order('sent_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching email logs:', error);
//       const memoryLogs = global.emailLogs || [];

//       const successfulEmails = memoryLogs
//         .filter(log => log.status === 'success')
//         .map(log => log.email);

//       const skippedEmails = memoryLogs
//         .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//         .map(log => log.email);

//       return res.status(200).json({
//         success: true,
//         data: memoryLogs,
//         successfulEmails,
//         skippedEmails,
//         source: 'memory'
//       });
//     }

//     const successfulEmails = data
//       .filter(log => log.status === 'success')
//       .map(log => log.email);

//     const skippedEmails = data
//       .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//       .map(log => log.email);

//     return res.status(200).json({
//       success: true,
//       data: data,
//       successfulEmails,
//       skippedEmails,
//       source: 'database'
//     });
//   } catch (error) {
//     console.error('Server error fetching logs:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Controller for sending emails to all recipients in DB
// const sendEmailsToAll = async (req, res) => {
//   try {
//     // First, process any file upload (resume)
//     try {
//       await processFileUpload(req, res);
//     } catch (uploadError) {
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${uploadError.message}`
//       });
//     }

//     const emailSubject = req.body.subject;
//     const emailContent = req.body.content;
    
//     if (!emailSubject || !emailContent) {
//       return res.status(400).json({
//         success: false,
//         error: 'Email subject and content are required'
//       });
//     }

//     const resumePath = req.file ? req.file.path : null;

//     // Get all ACTIVE emails
//     let emails = [];
//     try {
//       const { data, error } = await supabase
//         .from('emails')
//         .select('email')
//         .eq('active', 1);
      
//       if (error && error.code === '42P01') {
//         emails = emailStorage
//           .filter(item => item.active === 1)
//           .map(item => item.email);
//       } else if (error) {
//         throw error;
//       } else {
//         emails = data.map(item => item.email);
//       }
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }

//     if (emails.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No active emails found to send to'
//       });
//     }

//     console.log(`Preparing to send emails to ${emails.length} active recipients`);
//     console.log(`Email subject: ${emailSubject}`);
//     console.log(`Email content: ${emailContent.substring(0, 100)}...`);
//     if (resumePath) {
//       console.log(`Attaching resume: ${resumePath}`);
//     }

//     const results = { 
//       success: [], 
//       failed: [],
//       skipped: []
//     };
    
//     const campaignId = Date.now().toString();
    
//    const getRandomDelay = () => {
//   const minDelay = 180000; // 3 min
//   const maxDelay = 240000; // 4 min
//   return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
// };


    
//     for (let i = 0; i < emails.length; i++) {
//       const email = emails[i];
      
//       const alreadySent = await checkIfEmailAlreadySent(email, emailSubject);
//       if (alreadySent) {
//         console.log(`⏭️ Skipping email to ${email}: already sent successfully`);
//         results.skipped.push(email);
//         await logEmailResult(email, emailSubject, 'skipped', 'Email already sent successfully');
//         continue;
//       }
      
//       try {
//         await sendEmail(email, emailSubject, emailContent, resumePath);
//         results.success.push(email);
//         console.log(`✅ Email sent successfully to: ${email}`);
//         await logEmailResult(email, emailSubject, 'success');
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${email}:`, error.message);
//         const errorMsg = error.response?.body ? 
//           JSON.stringify(error.response.body) : error.message;
//         results.failed.push({ email, error: errorMsg });
//         await logEmailResult(email, emailSubject, 'failed', errorMsg);
//       }
      
//       if (i < emails.length - 1) {
//         const delayMs = getRandomDelay();
//         const delayMinutes = (delayMs / 60000).toFixed(1);
//         console.log(`Waiting ${delayMinutes} minutes (${delayMs}ms) before sending the next email...`);
//         await new Promise(resolve => setTimeout(resolve, delayMs));
//       }
//     }

//     await logEmailResult(
//       process.env.BREVO_SENDER_EMAIL, 
//       `Campaign Summary: ${emailSubject}`,
//       'campaign_summary', 
//       JSON.stringify({
//         campaignId,
//         totalEmails: emails.length,
//         successful: results.success.length,
//         failed: results.failed.length,
//         skipped: results.skipped.length
//       })
//     );

//     if (resumePath && fs.existsSync(resumePath)) {
//       try {
//         fs.unlinkSync(resumePath);
//         console.log(`Deleted temporary file: ${resumePath}`);
//       } catch (deleteError) {
//         console.error(`Error deleting file: ${deleteError.message}`);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       sentCount: results.success.length,
//       failedCount: results.failed.length,
//       skippedCount: results.skipped.length,
//       totalAttempted: emails.length,
//       campaignId,
//       failedEmails: results.failed.length > 0 ? results.failed : undefined,
//       skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
//     });
    
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Secondary multer storage for single email upload endpoint
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB
//   },
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype === 'application/pdf' || 
//       file.mimetype === 'application/msword' || 
//       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF and Word documents are allowed'));
//     }
//   }
// });

// const uploadMiddleware = upload.single('file');

// // Controller for sending an email to a single recipient
// const sendSingleEmail = async (req, res) => {
//   uploadMiddleware(req, res, async (err) => {
//     if (err) {
//       console.error('File upload error:', err);
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${err.message}`
//       });
//     }

//     try {
//       let resumePath = null;
//       if (req.file) {
//         resumePath = req.file.path;
//         console.log(`File uploaded successfully to: ${resumePath}`);
//       }

//       const { subject, content, recipients: recipientsInput } = req.body;
//       console.log('Received form data:', {
//         subject,
//         content,
//         recipientsInput
//       });

//       let recipients;
//       if (typeof recipientsInput === 'string') {
//         try {
//           recipients = JSON.parse(recipientsInput);
//         } catch (e) {
//           recipients = [recipientsInput];
//         }
//       } else {
//         recipients = recipientsInput;
//       }

//       if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
//         return res.status(400).json({
//           success: false,
//           error: 'Email subject, content, and at least one recipient are required'
//         });
//       }

//       const recipient = recipients[0];
//       console.log(`Preparing to send email to: ${recipient}`);
//       console.log(`Email subject: ${subject}`);
//       console.log(`Email content: ${content.substring(0, 100)}...`);

//       try {
//         const alreadySent = await checkIfEmailAlreadySent(recipient, subject);
//         if (alreadySent) {
//           console.log(`⏭️ Skipping email to ${recipient}: already sent successfully`);
//           if (resumePath && fs.existsSync(resumePath)) {
//             fs.unlinkSync(resumePath);
//           }
          
//           return res.status(200).json({
//             success: true,
//             message: `Email to ${recipient} was already sent successfully`,
//             status: 'skipped'
//           });
//         }

//         await sendEmail(recipient, subject, content, resumePath);
//         await logEmailResult(recipient, subject, 'success');
//         console.log(`✅ Email sent successfully to: ${recipient}`);
        
//         if (resumePath && fs.existsSync(resumePath)) {
//           try {
//             fs.unlinkSync(resumePath);
//             console.log(`Deleted temporary file: ${resumePath}`);
//           } catch (deleteError) {
//             console.error(`Error deleting file: ${deleteError.message}`);
//           }
//         }
        
//         return res.status(200).json({
//           success: true,
//           message: `Email sent successfully to ${recipient}`
//         });
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${recipient}:`, error.message);
//         const errorMsg = error.response?.body ? 
//           JSON.stringify(error.response.body) : error.message;
//         await logEmailResult(recipient, subject, 'failed', errorMsg);
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
//         return res.status(500).json({
//           success: false,
//           error: `Failed to send email: ${errorMsg}`
//         });
//       }
//     } catch (error) {
//       console.error('Server error:', error);
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(500).json({
//         success: false,
//         error: `Server error: ${error.message}`
//       });
//     }
//   });
// };

// // Delete a single email log
// const deleteEmailLog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { error } = await supabase
//       .from('email_logs')
//       .delete()
//       .eq('id', id);
    
//     if (error) {
//       console.error('Error deleting email log:', error);
//       if (global.emailLogs) {
//         const index = global.emailLogs.findIndex(log => log.id === id);
//         if (index !== -1) {
//           global.emailLogs.splice(index, 1);
//           return res.status(200).json({
//             success: true,
//             message: 'Log deleted successfully from memory'
//           });
//         }
//       }
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${error.message}`
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: 'Log deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Delete all email logs
// const deleteAllEmailLogs = async (req, res) => {
//   try {
//     console.log('Starting deletion of all email logs...');
//     const { data, error } = await supabase.rpc('truncate_email_logs');
    
//     if (error) {
//       console.error('Error deleting all email logs:', error);
//       const { error: deleteError } = await supabase.from('email_logs').delete();
//       if (deleteError) {
//         console.error('Fallback deletion also failed:', deleteError);
//         return res.status(500).json({
//           success: false,
//           error: `Could not delete logs: ${deleteError.message}`
//         });
//       }
//     }
    
//     if (global.emailLogs) {
//       global.emailLogs = [];
//     }
    
//     console.log('Successfully deleted all email logs');
//     return res.status(200).json({
//       success: true,
//       message: 'All email logs deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error during log deletion:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// const batchDeleteLogs = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid array of email log IDs is required'
//       });
//     }
    
//     try {
//       const { error } = await supabase
//         .from('email_logs')
//         .delete()
//         .in('id', ids);
      
//       if (error) {
//         if (error.code === '42P01') {
//           return res.status(404).json({
//             success: false,
//             error: 'Email logs table does not exist and in-memory storage is not initialized',
//             suggestion: 'Create an email_logs table in your database'
//           });
//         } else {
//           throw error;
//         }
//       }
      
//       return res.status(200).json({
//         success: true,
//         message: `${ids.length} email logs deleted successfully`,
//         source: 'database'
//       });
      
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// module.exports = {
//   sendEmailsToAll,
//   sendSingleEmail,
//   getEmailLogs,
//   deleteEmailLog,
//   deleteAllEmailLogs,
//   batchDeleteLogs
// };









// const { supabase, emailStorage } = require('./emailHandlers');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// /*
// =============================================================================
// EMAIL CONTROLLER WITH BREVO (Sendinblue) API
// =============================================================================

// SETUP INSTRUCTIONS:
// 1. Install: npm install sib-api-v3-sdk
// 2. Set environment variables in .env:
//    BREVO_API_KEY=xkeysib-your-api-key-here
//    BREVO_SENDER_EMAIL=your-verified-email@example.com
//    BREVO_SENDER_NAME=Your Name
//    DEBUG_MODE=true  (optional, for detailed logs)

// 3. Add test route to your server.js:
//    const emailController = require('./emailController');
//    app.post('/test-attachment', 
//      emailController.uploadMiddleware, 
//      emailController.testBrevoAttachment
//    );

// TESTING ATTACHMENTS:
// Test with curl:
//   curl -X POST http://localhost:3000/test-attachment \
//     -F "file=@/path/to/resume.pdf"

// Or use Postman/Thunder Client:
//   - Method: POST
//   - URL: http://localhost:3000/test-attachment
//   - Body: form-data
//   - Key: "file" (type: File)
//   - Value: Select your PDF/DOCX file

// TROUBLESHOOTING 1KB PDF ISSUE:
// If emails receive a 1KB file instead of your actual resume:

// 1. CHECK FRONTEND - Most common issue!
//    Your form MUST have:
//    <form enctype="multipart/form-data">
   
//    Your JavaScript MUST use actual File object:
//    const formData = new FormData();
//    formData.append('resume', fileInput.files[0]); // NOT path string!
   
//    Common mistakes:
//    ❌ formData.append('resume', 'resume.pdf')  // Wrong - string path
//    ❌ formData.append('resume', '/path/to/file') // Wrong - path
//    ✅ formData.append('resume', fileInput.files[0]) // Correct - File object

// 2. CHECK SERVER LOGS:
//    Look for "FILE UPLOAD DIAGNOSTIC" section
//    - If size is 0 or <1KB → Frontend not sending file correctly
//    - If "No file uploaded" → Field name mismatch (should be 'resume')
//    - If "File not found" → Server permission issue

// 3. VERIFY WITH TEST ENDPOINT:
//    Use the /test-attachment endpoint to isolate the issue
//    If test works but your endpoint doesn't → problem is in your code
//    If test fails → problem is frontend or server setup

// 4. CHECK FILE ON DISK:
//    ls -la resume_uploads/
//    If files are tiny → frontend issue
//    If no files → multer not working

// COMMON FIXES:
// - Frontend: Use fileInput.files[0], not file path
// - Backend: Field name must match ('resume' for bulk, 'file' for single)
// - Server: Ensure resume_uploads/ directory has write permissions
// - Brevo: Verify sender email in Brevo dashboard

// =============================================================================
// */

// console.log('Environment loaded:', {
//   hasApiKey: !!process.env.BREVO_API_KEY,
//   hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL
// });

// // Initialize Brevo (Sendinblue)
// const SibApiV3Sdk = require('sib-api-v3-sdk');
// const defaultClient = SibApiV3Sdk.ApiClient.instance;
// const apiKey = defaultClient.authentications['api-key'];
// apiKey.apiKey = process.env.BREVO_API_KEY;

// const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// // ========== DEBUGGING & TESTING UTILITIES ==========

// // Enable/disable debug mode
// const DEBUG = process.env.DEBUG_MODE === 'true' || false;

// // Debug logger
// const debugLog = (message, data = null) => {
//   if (DEBUG) {
//     console.log(`[DEBUG] ${message}`, data || '');
//   }
// };

// // Test endpoint function - call this from your routes to test attachments
// const testBrevoAttachment = async (req, res) => {
//   console.log('=== Testing Brevo Email with Attachment ===\n');
  
//   try {
//     // Check environment
//     if (!process.env.BREVO_API_KEY) {
//       return res.status(500).json({ success: false, error: 'BREVO_API_KEY not set' });
//     }
//     if (!process.env.BREVO_SENDER_EMAIL) {
//       return res.status(500).json({ success: false, error: 'BREVO_SENDER_EMAIL not set' });
//     }
    
//     // Check if file was uploaded
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'No file uploaded. Send a file with field name "file" or "resume"' 
//       });
//     }
    
//     console.log('File received:', {
//       originalname: req.file.originalname,
//       filename: req.file.filename,
//       size: req.file.size,
//       mimetype: req.file.mimetype,
//       path: req.file.path
//     });
    
//     // Verify file on disk
//     if (!fs.existsSync(req.file.path)) {
//       return res.status(500).json({ 
//         success: false, 
//         error: 'File uploaded but not found on disk' 
//       });
//     }
    
//     const fileStats = fs.statSync(req.file.path);
//     console.log(`File verified on disk: ${fileStats.size} bytes`);
    
//     // Create attachment
//     const fileBuffer = fs.readFileSync(req.file.path);
//     const base64Content = fileBuffer.toString('base64');
//     const filename = path.basename(req.file.path);
    
//     console.log('Attachment details:', {
//       filename: filename,
//       originalSize: fileBuffer.length,
//       base64Length: base64Content.length,
//       base64Preview: base64Content.substring(0, 50) + '...'
//     });
    
//     // Create test email
//     const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
//     sendSmtpEmail.sender = {
//       email: process.env.BREVO_SENDER_EMAIL,
//       name: process.env.BREVO_SENDER_NAME || 'Test Sender'
//     };
    
//     // Send to sender email as test
//     const testRecipient = process.env.BREVO_SENDER_EMAIL;
//     sendSmtpEmail.to = [{ email: testRecipient }];
//     sendSmtpEmail.subject = 'TEST: Brevo Attachment Verification';
//     sendSmtpEmail.htmlContent = `
//       <html>
//         <body>
//           <h2>Attachment Test Email</h2>
//           <p>This is a test email to verify attachments are working.</p>
//           <p><strong>File Details:</strong></p>
//           <ul>
//             <li>Original filename: ${req.file.originalname}</li>
//             <li>Size: ${fileBuffer.length} bytes</li>
//             <li>Type: ${req.file.mimetype}</li>
//           </ul>
//           <p>✅ If you can download and open the attachment, it's working!</p>
//         </body>
//       </html>
//     `;
    
//     sendSmtpEmail.attachment = [{
//       content: base64Content,
//       name: req.file.originalname
//     }];
    
//     console.log('Sending test email to:', testRecipient);
    
//     // Send via Brevo
//     const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
//     console.log('✅ Test email sent successfully!');
//     console.log('Message ID:', result.messageId);
    
//     // Clean up test file
//     fs.unlinkSync(req.file.path);
//     console.log('Test file cleaned up');
    
//     return res.status(200).json({
//       success: true,
//       message: 'Test email sent successfully',
//       details: {
//         recipient: testRecipient,
//         filename: req.file.originalname,
//         size: fileBuffer.length,
//         messageId: result.messageId
//       }
//     });
    
//   } catch (error) {
//     console.error('❌ Test failed:', error.message);
//     if (error.response?.body) {
//       console.error('Brevo API Error:', error.response.body);
//     }
    
//     // Clean up file if exists
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
    
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//       details: error.response?.body || null
//     });
//   }
// };

// // ========== END DEBUGGING UTILITIES ==========


// // Helper to build Brevo attachment from a file path (base64)
// const fileToBase64Attachment = (attachmentPath) => {
//   try {
//     // Read file as base64
//     const fileBuffer = fs.readFileSync(attachmentPath);
//     const content = fileBuffer.toString('base64');
//     const filename = path.basename(attachmentPath);
    
//     console.log(`Creating attachment: ${filename}, size: ${fileBuffer.length} bytes`);
    
//     return {
//       content: content,
//       name: filename
//     };
//   } catch (error) {
//     console.error('Error creating attachment:', error);
//     throw error;
//   }
// };

// // Configure multer for resume uploads
// const resumeStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, 'resume_uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const resumeUpload = multer({ 
//   storage: resumeStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const filetypes = /pdf|docx/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Error: Only PDF and DOCX files are allowed!'));
//     }
//   }
// }).single('resume');

// // Function to send email to a single recipient with optional attachment via Brevo
// const sendEmail = async (recipient, subject, html, attachmentPath = null) => {
//   console.log('\n========== SENDING EMAIL ==========');
//   console.log('Recipient:', recipient);
//   console.log('Subject:', subject);
//   console.log('Has attachment path:', !!attachmentPath);
  
//   const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
//   sendSmtpEmail.sender = {
//     email: process.env.BREVO_SENDER_EMAIL,
//     name: process.env.BREVO_SENDER_NAME || undefined
//   };
  
//   sendSmtpEmail.to = [{ email: recipient }];
//   sendSmtpEmail.subject = subject;
//   sendSmtpEmail.htmlContent = html;

//   // Add attachment if provided
//   if (attachmentPath) {
//     console.log('Attachment path provided:', attachmentPath);
    
//     if (fs.existsSync(attachmentPath)) {
//       try {
//         // Check file details before encoding
//         const fileStats = fs.statSync(attachmentPath);
//         console.log('File stats:', {
//           path: attachmentPath,
//           size: fileStats.size,
//           isFile: fileStats.isFile()
//         });
        
//         if (fileStats.size === 0) {
//           console.error('❌ WARNING: File size is 0 bytes! File may be corrupted.');
//         }
        
//         // Create attachment
//         const attachment = fileToBase64Attachment(attachmentPath);
//         sendSmtpEmail.attachment = [attachment];
        
//         console.log('✅ Attachment successfully added to email');
//         console.log('Attachment details:', {
//           name: attachment.name,
//           contentLength: attachment.content.length,
//           estimatedSize: `${Math.round(attachment.content.length * 0.75 / 1024)} KB`
//         });
        
//       } catch (attachError) {
//         console.error('❌ Error adding attachment:', attachError.message);
//         throw new Error(`Failed to attach file: ${attachError.message}`);
//       }
//     } else {
//       console.error('❌ ERROR: Attachment file does not exist at path:', attachmentPath);
//       console.error('Current working directory:', process.cwd());
//       throw new Error(`Attachment file not found: ${attachmentPath}`);
//     }
//   } else {
//     console.log('No attachment for this email');
//   }

//   try {
//     console.log('📤 Calling Brevo API...');
//     const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
//     console.log('✅ Email sent successfully via Brevo');
//     debugLog('Brevo API Response:', result);
//     console.log('===================================\n');
//     return result;
//   } catch (error) {
//     console.error('❌ Brevo API Error:', error.message);
//     if (error.response?.body) {
//       console.error('API Error Details:', JSON.stringify(error.response.body, null, 2));
//     }
//     console.log('===================================\n');
//     throw error;
//   }
// };

// // Log email sending result to database
// const logEmailResult = async (email, subject, status, errorMessage = null) => {
//   try {
//     const timestamp = new Date().toISOString();
//     const logEntry = {
//       email,
//       subject,
//       status, // 'success' or 'failed' or 'skipped' or 'campaign_summary'
//       error_message: errorMessage,
//       sent_at: timestamp
//     };

//     const { data, error } = await supabase
//       .from('email_logs')
//       .insert([logEntry]);
    
//     if (error) {
//       console.error('Failed to log email result to database:', error);
//       if (!global.emailLogs) {
//         global.emailLogs = [];
//       }
//       global.emailLogs.push(logEntry);
//     }
    
//     return logEntry;
//   } catch (error) {
//     console.error('Error logging email result:', error);
//     return null;
//   }
// };

// // Process the request with multer file upload middleware
// const processFileUpload = (req, res) => {
//   return new Promise((resolve, reject) => {
//     resumeUpload(req, res, (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve();
//       }
//     });
//   });
// };

// // Check if email has already been sent successfully
// const checkIfEmailAlreadySent = async (email, subject) => {
//   try {
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .eq('email', email)
//       .eq('subject', subject)
//       .eq('status', 'success')
//       .limit(1);
    
//     if (error) {
//       console.error('Error checking email log:', error);
//       if (global.emailLogs) {
//         const found = global.emailLogs.find(log => 
//           log.email === email && 
//           log.subject === subject && 
//           log.status === 'success'
//         );
//         return !!found;
//       }
//       return false;
//     }
    
//     return data && data.length > 0;
    
//   } catch (error) {
//     console.error('Error checking if email was already sent:', error);
//     return false;
//   }
// };

// const getEmailLogs = async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('email_logs')
//       .select('*')
//       .order('sent_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching email logs:', error);
//       const memoryLogs = global.emailLogs || [];

//       const successfulEmails = memoryLogs
//         .filter(log => log.status === 'success')
//         .map(log => log.email);

//       const skippedEmails = memoryLogs
//         .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//         .map(log => log.email);

//       return res.status(200).json({
//         success: true,
//         data: memoryLogs,
//         successfulEmails,
//         skippedEmails,
//         source: 'memory'
//       });
//     }

//     const successfulEmails = data
//       .filter(log => log.status === 'success')
//       .map(log => log.email);

//     const skippedEmails = data
//       .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
//       .map(log => log.email);

//     return res.status(200).json({
//       success: true,
//       data: data,
//       successfulEmails,
//       skippedEmails,
//       source: 'database'
//     });
//   } catch (error) {
//     console.error('Server error fetching logs:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Controller for sending emails to all recipients in DB
// const sendEmailsToAll = async (req, res) => {
//   try {
//     // First, process any file upload (resume)
//     try {
//       await processFileUpload(req, res);
//     } catch (uploadError) {
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${uploadError.message}`
//       });
//     }

//     const emailSubject = req.body.subject;
//     const emailContent = req.body.content;
    
//     if (!emailSubject || !emailContent) {
//       return res.status(400).json({
//         success: false,
//         error: 'Email subject and content are required'
//       });
//     }

//     const resumePath = req.file ? req.file.path : null;
    
//     console.log('\n========== FILE UPLOAD DIAGNOSTIC ==========');
//     // Debug file upload
//     if (req.file) {
//       console.log('✅ File received by server');
//       console.log('File details:', {
//         originalName: req.file.originalname,
//         savedAs: req.file.filename,
//         path: req.file.path,
//         size: `${req.file.size} bytes (${(req.file.size / 1024).toFixed(2)} KB)`,
//         mimetype: req.file.mimetype,
//         encoding: req.file.encoding
//       });
      
//       // Verify file exists and has content
//       if (fs.existsSync(req.file.path)) {
//         const stats = fs.statSync(req.file.path);
//         console.log(`✅ File verified on disk: ${stats.size} bytes`);
        
//         if (stats.size === 0) {
//           console.error('❌ CRITICAL: File is 0 bytes - not uploaded correctly from frontend!');
//         } else if (stats.size < 1000) {
//           console.warn('⚠️  WARNING: File very small (<1KB) - may be corrupted');
//         }
        
//         // Verify file content
//         const buffer = fs.readFileSync(req.file.path);
//         console.log('First 10 bytes (hex):', buffer.slice(0, 10).toString('hex'));
        
//         if (req.file.mimetype === 'application/pdf') {
//           const isPDF = buffer.slice(0, 4).toString() === '%PDF';
//           console.log(isPDF ? '✅ Valid PDF' : '❌ Invalid PDF - corrupted!');
//         }
//       } else {
//         console.error('❌ CRITICAL: File not found on disk!');
//       }
//     } else {
//       console.log('ℹ️  No file - Check frontend: enctype="multipart/form-data", field="resume"');
//     }
//     console.log('===========================================\n');

//     // Get all ACTIVE emails
//     let emails = [];
//     try {
//       const { data, error } = await supabase
//         .from('emails')
//         .select('email')
//         .eq('active', 1);
      
//       if (error && error.code === '42P01') {
//         emails = emailStorage
//           .filter(item => item.active === 1)
//           .map(item => item.email);
//       } else if (error) {
//         throw error;
//       } else {
//         emails = data.map(item => item.email);
//       }
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }

//     if (emails.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No active emails found to send to'
//       });
//     }

//     console.log(`Preparing to send emails to ${emails.length} active recipients`);
//     console.log(`Email subject: ${emailSubject}`);
//     console.log(`Email content: ${emailContent.substring(0, 100)}...`);
//     if (resumePath) {
//       console.log(`Attaching resume: ${resumePath}`);
//     }

//     const results = { 
//       success: [], 
//       failed: [],
//       skipped: []
//     };
    
//     const campaignId = Date.now().toString();
    
//     const getRandomDelay = () => {
//       const minDelay = 420000; // 7 min
//       const maxDelay = 600000; // 10 min
//       return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
//     };

    
//     for (let i = 0; i < emails.length; i++) {
//       const email = emails[i];
      
//       const alreadySent = await checkIfEmailAlreadySent(email, emailSubject);
//       if (alreadySent) {
//         console.log(`⏭️ Skipping email to ${email}: already sent successfully`);
//         results.skipped.push(email);
//         await logEmailResult(email, emailSubject, 'skipped', 'Email already sent successfully');
//         continue;
//       }
      
//       try {
//         await sendEmail(email, emailSubject, emailContent, resumePath);
//         results.success.push(email);
//         console.log(`✅ Email sent successfully to: ${email}`);
//         await logEmailResult(email, emailSubject, 'success');
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${email}:`, error.message);
//         const errorMsg = error.response?.body ? 
//           JSON.stringify(error.response.body) : error.message;
//         results.failed.push({ email, error: errorMsg });
//         await logEmailResult(email, emailSubject, 'failed', errorMsg);
//       }
      
//       if (i < emails.length - 1) {
//         const delayMs = getRandomDelay();
//         const delayMinutes = (delayMs / 60000).toFixed(1);
//         console.log(`Waiting ${delayMinutes} minutes (${delayMs}ms) before sending the next email...`);
//         await new Promise(resolve => setTimeout(resolve, delayMs));
//       }
//     }

//     await logEmailResult(
//       process.env.BREVO_SENDER_EMAIL, 
//       `Campaign Summary: ${emailSubject}`,
//       'campaign_summary', 
//       JSON.stringify({
//         campaignId,
//         totalEmails: emails.length,
//         successful: results.success.length,
//         failed: results.failed.length,
//         skipped: results.skipped.length
//       })
//     );

//     if (resumePath && fs.existsSync(resumePath)) {
//       try {
//         fs.unlinkSync(resumePath);
//         console.log(`Deleted temporary file: ${resumePath}`);
//       } catch (deleteError) {
//         console.error(`Error deleting file: ${deleteError.message}`);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       sentCount: results.success.length,
//       failedCount: results.failed.length,
//       skippedCount: results.skipped.length,
//       totalAttempted: emails.length,
//       campaignId,
//       failedEmails: results.failed.length > 0 ? results.failed : undefined,
//       skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
//     });
    
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Secondary multer storage for single email upload endpoint
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB
//   },
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype === 'application/pdf' || 
//       file.mimetype === 'application/msword' || 
//       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF and Word documents are allowed'));
//     }
//   }
// });

// const uploadMiddleware = upload.single('file');

// // Controller for sending an email to a single recipient
// const sendSingleEmail = async (req, res) => {
//   uploadMiddleware(req, res, async (err) => {
//     if (err) {
//       console.error('File upload error:', err);
//       return res.status(400).json({
//         success: false,
//         error: `File upload error: ${err.message}`
//       });
//     }

//     try {
//       let resumePath = null;
//       if (req.file) {
//         resumePath = req.file.path;
//         console.log(`File uploaded successfully to: ${resumePath}`);
//         console.log('File details:', {
//           filename: req.file.filename,
//           originalname: req.file.originalname,
//           size: req.file.size,
//           mimetype: req.file.mimetype
//         });
        
//         // Verify file
//         if (fs.existsSync(resumePath)) {
//           const stats = fs.statSync(resumePath);
//           console.log(`File verified on disk: ${stats.size} bytes`);
//         }
//       }

//       const { subject, content, recipients: recipientsInput } = req.body;
//       console.log('Received form data:', {
//         subject,
//         content,
//         recipientsInput
//       });

//       let recipients;
//       if (typeof recipientsInput === 'string') {
//         try {
//           recipients = JSON.parse(recipientsInput);
//         } catch (e) {
//           recipients = [recipientsInput];
//         }
//       } else {
//         recipients = recipientsInput;
//       }

//       if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
//         return res.status(400).json({
//           success: false,
//           error: 'Email subject, content, and at least one recipient are required'
//         });
//       }

//       const recipient = recipients[0];
//       console.log(`Preparing to send email to: ${recipient}`);
//       console.log(`Email subject: ${subject}`);
//       console.log(`Email content: ${content.substring(0, 100)}...`);

//       try {
//         const alreadySent = await checkIfEmailAlreadySent(recipient, subject);
//         if (alreadySent) {
//           console.log(`⏭️ Skipping email to ${recipient}: already sent successfully`);
//           if (resumePath && fs.existsSync(resumePath)) {
//             fs.unlinkSync(resumePath);
//           }
          
//           return res.status(200).json({
//             success: true,
//             message: `Email to ${recipient} was already sent successfully`,
//             status: 'skipped'
//           });
//         }

//         await sendEmail(recipient, subject, content, resumePath);
//         await logEmailResult(recipient, subject, 'success');
//         console.log(`✅ Email sent successfully to: ${recipient}`);
        
//         if (resumePath && fs.existsSync(resumePath)) {
//           try {
//             fs.unlinkSync(resumePath);
//             console.log(`Deleted temporary file: ${resumePath}`);
//           } catch (deleteError) {
//             console.error(`Error deleting file: ${deleteError.message}`);
//           }
//         }
        
//         return res.status(200).json({
//           success: true,
//           message: `Email sent successfully to ${recipient}`
//         });
//       } catch (error) {
//         console.error(`❌ Failed to send email to ${recipient}:`, error.message);
//         const errorMsg = error.response?.body ? 
//           JSON.stringify(error.response.body) : error.message;
//         await logEmailResult(recipient, subject, 'failed', errorMsg);
//         if (resumePath && fs.existsSync(resumePath)) {
//           fs.unlinkSync(resumePath);
//         }
//         return res.status(500).json({
//           success: false,
//           error: `Failed to send email: ${errorMsg}`
//         });
//       }
//     } catch (error) {
//       console.error('Server error:', error);
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(500).json({
//         success: false,
//         error: `Server error: ${error.message}`
//       });
//     }
//   });
// };

// // Delete a single email log
// const deleteEmailLog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { error } = await supabase
//       .from('email_logs')
//       .delete()
//       .eq('id', id);
    
//     if (error) {
//       console.error('Error deleting email log:', error);
//       if (global.emailLogs) {
//         const index = global.emailLogs.findIndex(log => log.id === id);
//         if (index !== -1) {
//           global.emailLogs.splice(index, 1);
//           return res.status(200).json({
//             success: true,
//             message: 'Log deleted successfully from memory'
//           });
//         }
//       }
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${error.message}`
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: 'Log deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// // Delete all email logs
// const deleteAllEmailLogs = async (req, res) => {
//   try {
//     console.log('Starting deletion of all email logs...');
//     const { data, error } = await supabase.rpc('truncate_email_logs');
    
//     if (error) {
//       console.error('Error deleting all email logs:', error);
//       const { error: deleteError } = await supabase.from('email_logs').delete();
//       if (deleteError) {
//         console.error('Fallback deletion also failed:', deleteError);
//         return res.status(500).json({
//           success: false,
//           error: `Could not delete logs: ${deleteError.message}`
//         });
//       }
//     }
    
//     if (global.emailLogs) {
//       global.emailLogs = [];
//     }
    
//     console.log('Successfully deleted all email logs');
//     return res.status(200).json({
//       success: true,
//       message: 'All email logs deleted successfully'
//     });
//   } catch (error) {
//     console.error('Server error during log deletion:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// const batchDeleteLogs = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid array of email log IDs is required'
//       });
//     }
    
//     try {
//       const { error } = await supabase
//         .from('email_logs')
//         .delete()
//         .in('id', ids);
      
//       if (error) {
//         if (error.code === '42P01') {
//           return res.status(404).json({
//             success: false,
//             error: 'Email logs table does not exist and in-memory storage is not initialized',
//             suggestion: 'Create an email_logs table in your database'
//           });
//         } else {
//           throw error;
//         }
//       }
      
//       return res.status(200).json({
//         success: true,
//         message: `${ids.length} email logs deleted successfully`,
//         source: 'database'
//       });
      
//     } catch (dbError) {
//       console.error('Database error:', dbError);
//       return res.status(500).json({
//         success: false,
//         error: `Database error: ${dbError.message}`
//       });
//     }
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({
//       success: false,
//       error: `Server error: ${error.message}`
//     });
//   }
// };

// /*
// =============================================================================
// EXPORTED FUNCTIONS - ADD TO YOUR SERVER.JS ROUTES:
// =============================================================================

// // Main email endpoints
// app.post('/send-emails-to-all', emailController.sendEmailsToAll);
// app.post('/send-email', emailController.sendSingleEmail);

// // Log management
// app.get('/email-logs', emailController.getEmailLogs);
// app.delete('/email-logs/:id', emailController.deleteEmailLog);
// app.delete('/email-logs', emailController.deleteAllEmailLogs);
// app.post('/email-logs/batch-delete', emailController.batchDeleteLogs);

// // Testing endpoint - USE THIS TO DEBUG ATTACHMENT ISSUES
// app.post('/test-attachment', 
//   emailController.uploadMiddleware, 
//   emailController.testBrevoAttachment
// );

// QUICK DEBUG CHECKLIST:
// □ Environment variables set (BREVO_API_KEY, BREVO_SENDER_EMAIL)
// □ Sender email verified in Brevo dashboard
// □ Frontend form has enctype="multipart/form-data"
// □ Frontend using fileInput.files[0], not file path string
// □ Field name matches ('resume' for bulk, 'file' for single)
// □ Test endpoint works: POST /test-attachment with file
// □ Check server logs for "FILE UPLOAD DIAGNOSTIC" section
// □ File size in logs is NOT 0 or <1KB
// =============================================================================
// */

// module.exports = {
//   sendEmailsToAll,
//   sendSingleEmail,
//   getEmailLogs,
//   deleteEmailLog,
//   deleteAllEmailLogs,
//   batchDeleteLogs,
 
// };






const { supabase, emailStorage } = require('./emailHandlers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

/*
=============================================================================
EMAIL CONTROLLER WITH BREVO (Sendinblue) API
=============================================================================

SETUP INSTRUCTIONS:
1. Install: npm install sib-api-v3-sdk
2. Set environment variables in .env:
   BREVO_API_KEY=xkeysib-your-api-key-here
   BREVO_SENDER_EMAIL=your-verified-email@example.com
   BREVO_SENDER_NAME=Your Name
   DEBUG_MODE=true  (optional, for detailed logs)

3. Add test route to your server.js:
   const emailController = require('./emailController');
   app.post('/test-attachment', 
     emailController.uploadMiddleware, 
     emailController.testBrevoAttachment
   );

USING RESUMES FROM SUPABASE STORAGE:
If your resumes are stored in Supabase Storage (not uploaded via form):

1. In your request body, send:
   {
     "subject": "Application for Position",
     "content": "<html>Your email content</html>",
     "resumeFileName": "nawees_frontend_developer.pdf"  // Filename from Supabase
   }

2. The controller will:
   - Download the resume from Supabase Storage
   - Attach it to the email
   - Send via Brevo
   - Clean up temporary file

Example API call:
  POST /send-emails-to-all
  Body: {
    "subject": "Job Application",
    "content": "<html>Email body</html>",
    "resumeFileName": "nawees_frontend_developer.pdf"
  }

TESTING ATTACHMENTS:
Test with curl:
  curl -X POST http://localhost:3000/test-attachment \
    -F "file=@/path/to/resume.pdf"

Or use Postman/Thunder Client:
  - Method: POST
  - URL: http://localhost:3000/test-attachment
  - Body: form-data
  - Key: "file" (type: File)
  - Value: Select your PDF/DOCX file

TROUBLESHOOTING 1KB PDF ISSUE:
If emails receive a 1KB file instead of your actual resume:

1. CHECK FRONTEND - Most common issue!
   Your form MUST have:
   <form enctype="multipart/form-data">
   
   Your JavaScript MUST use actual File object:
   const formData = new FormData();
   formData.append('resume', fileInput.files[0]); // NOT path string!
   
   Common mistakes:
   ❌ formData.append('resume', 'resume.pdf')  // Wrong - string path
   ❌ formData.append('resume', '/path/to/file') // Wrong - path
   ✅ formData.append('resume', fileInput.files[0]) // Correct - File object

2. CHECK SERVER LOGS:
   Look for "FILE UPLOAD DIAGNOSTIC" section
   - If size is 0 or <1KB → Frontend not sending file correctly
   - If "No file uploaded" → Field name mismatch (should be 'resume')
   - If "File not found" → Server permission issue

3. VERIFY WITH TEST ENDPOINT:
   Use the /test-attachment endpoint to isolate the issue
   If test works but your endpoint doesn't → problem is in your code
   If test fails → problem is frontend or server setup

4. CHECK FILE ON DISK:
   ls -la resume_uploads/
   If files are tiny → frontend issue
   If no files → multer not working

COMMON FIXES:
- Frontend: Use fileInput.files[0], not file path
- Backend: Field name must match ('resume' for bulk, 'file' for single)
- Server: Ensure resume_uploads/ directory has write permissions
- Brevo: Verify sender email in Brevo dashboard
- Supabase: Use resumeFileName parameter to attach from Supabase Storage

=============================================================================
*/

console.log('Environment loaded:', {
  hasApiKey: !!process.env.BREVO_API_KEY,
  hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL
});

// Initialize Brevo (Sendinblue)
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// ========== SUPABASE STORAGE HELPERS ==========

// Download file from Supabase storage and save temporarily
const downloadFromSupabase = async (storagePath, bucketName = 'resumes') => {
  try {
    console.log(`Downloading from Supabase: ${bucketName}/${storagePath}`);
    
    // Download file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);
    
    if (error) {
      console.error('Supabase download error:', error);
      throw new Error(`Failed to download from Supabase: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data received from Supabase storage');
    }
    
    console.log(`✅ Downloaded from Supabase: ${data.size} bytes`);
    
    // Save to temporary file
    const tempDir = path.join(__dirname, 'temp_downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filename = path.basename(storagePath);
    const tempPath = path.join(tempDir, `${Date.now()}-${filename}`);
    
    // Convert blob to buffer and save
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    
    console.log(`✅ Saved to temp file: ${tempPath} (${buffer.length} bytes)`);
    
    return tempPath;
    
  } catch (error) {
    console.error('Error downloading from Supabase:', error);
    throw error;
  }
};

// Get resume path - either from uploaded file or Supabase storage
const getResumePath = async (req) => {
  // Priority 1: File uploaded in this request (only if valid size)
  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    const stats = fs.statSync(req.file.path);
    
    // Validate file size - reject if corrupted
    if (stats.size >= 5000) {
      console.log('Using uploaded file from request (validated)');
      return { path: req.file.path, isTemp: false };
    } else {
      console.warn(`Skipping corrupted upload (${stats.size} bytes), trying Supabase...`);
      // Don't return, fall through to Supabase options
    }
  }
  
  // Priority 2: Supabase storage path provided in request body
  if (req.body.resumeStoragePath) {
    console.log('Downloading resume from Supabase storage (by path)');
    const bucketName = req.body.resumeBucket || 'resumes';
    const tempPath = await downloadFromSupabase(req.body.resumeStoragePath, bucketName);
    return { path: tempPath, isTemp: true };
  }
  
  // Priority 3: Resume file_name from request body (search in Supabase)
  if (req.body.resumeFileName) {
    console.log('Downloading resume from Supabase storage (by filename)');
    const bucketName = req.body.resumeBucket || 'resumes';
    const tempPath = await downloadFromSupabase(req.body.resumeFileName, bucketName);
    return { path: tempPath, isTemp: true };
  }
  
  return { path: null, isTemp: false };
};

// Clean up temporary file
const cleanupTempFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath) && filePath.includes('temp_downloads')) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error.message);
  }
};

// ========== END SUPABASE STORAGE HELPERS ==========

// ========== DEBUGGING & TESTING UTILITIES ==========

// Enable/disable debug mode
const DEBUG = process.env.DEBUG_MODE === 'true' || false;

// Debug logger
const debugLog = (message, data = null) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

// Test endpoint function - call this from your routes to test attachments
const testBrevoAttachment = async (req, res) => {
  console.log('=== Testing Brevo Email with Attachment ===\n');
  
  try {
    // Check environment
    if (!process.env.BREVO_API_KEY) {
      return res.status(500).json({ success: false, error: 'BREVO_API_KEY not set' });
    }
    if (!process.env.BREVO_SENDER_EMAIL) {
      return res.status(500).json({ success: false, error: 'BREVO_SENDER_EMAIL not set' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded. Send a file with field name "file" or "resume"' 
      });
    }
    
    console.log('File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });
    
    // Verify file on disk
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({ 
        success: false, 
        error: 'File uploaded but not found on disk' 
      });
    }
    
    const fileStats = fs.statSync(req.file.path);
    console.log(`File verified on disk: ${fileStats.size} bytes`);
    
    // Create attachment
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Content = fileBuffer.toString('base64');
    const filename = path.basename(req.file.path);
    
    console.log('Attachment details:', {
      filename: filename,
      originalSize: fileBuffer.length,
      base64Length: base64Content.length,
      base64Preview: base64Content.substring(0, 50) + '...'
    });
    
    // Create test email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME || 'Test Sender'
    };
    
    // Send to sender email as test
    const testRecipient = process.env.BREVO_SENDER_EMAIL;
    sendSmtpEmail.to = [{ email: testRecipient }];
    sendSmtpEmail.subject = 'TEST: Brevo Attachment Verification';
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <h2>Attachment Test Email</h2>
          <p>This is a test email to verify attachments are working.</p>
          <p><strong>File Details:</strong></p>
          <ul>
            <li>Original filename: ${req.file.originalname}</li>
            <li>Size: ${fileBuffer.length} bytes</li>
            <li>Type: ${req.file.mimetype}</li>
          </ul>
          <p>✅ If you can download and open the attachment, it's working!</p>
        </body>
      </html>
    `;
    
    sendSmtpEmail.attachment = [{
      content: base64Content,
      name: req.file.originalname
    }];
    
    console.log('Sending test email to:', testRecipient);
    
    // Send via Brevo
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    // Clean up test file
    fs.unlinkSync(req.file.path);
    console.log('Test file cleaned up');
    
    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        recipient: testRecipient,
        filename: req.file.originalname,
        size: fileBuffer.length,
        messageId: result.messageId
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.body) {
      console.error('Brevo API Error:', error.response.body);
    }
    
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.body || null
    });
  }
};

// ========== END DEBUGGING UTILITIES ==========

// Helper function to download resume from Supabase Storage
const downloadResumeFromSupabase = async (fileName, bucketName = 'resumes') => {
  console.log(`\n========== DOWNLOADING FROM SUPABASE STORAGE ==========`);
  console.log(`Bucket: ${bucketName}`);
  console.log(`File: ${fileName}`);
  
  try {
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(fileName);
    
    if (error) {
      console.error('❌ Supabase Storage error:', error);
      throw new Error(`Failed to download from Supabase: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from Supabase Storage');
    }
    
    console.log('✅ File downloaded from Supabase');
    console.log('File size:', data.size, 'bytes');
    console.log('File type:', data.type);
    
    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Buffer size:', buffer.length, 'bytes');
    
    // Save to temporary directory
    const tempDir = path.join(__dirname, 'temp_resumes');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log('✅ Saved to temporary file:', tempFilePath);
    
    // Verify file
    const stats = fs.statSync(tempFilePath);
    console.log('Verified file size on disk:', stats.size, 'bytes');
    
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty (0 bytes)');
    }
    
    console.log('=======================================================\n');
    
    return tempFilePath;
    
  } catch (error) {
    console.error('❌ Error downloading from Supabase:', error.message);
    console.log('=======================================================\n');
    throw error;
  }
};



// ========== END HELPER FUNCTIONS ==========


// Helper to build Brevo attachment from a file path (base64)
const fileToBase64Attachment = (attachmentPath) => {
  try {
    // Read file as base64
    const fileBuffer = fs.readFileSync(attachmentPath);
    const content = fileBuffer.toString('base64');
    const filename = path.basename(attachmentPath);
    
    console.log(`Creating attachment: ${filename}, size: ${fileBuffer.length} bytes`);
    
    return {
      content: content,
      name: filename
    };
  } catch (error) {
    console.error('Error creating attachment:', error);
    throw error;
  }
};

// Configure multer for resume uploads
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'resume_uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const resumeUpload = multer({ 
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only PDF and DOCX files are allowed!'));
    }
  }
}).single('resume');

// Function to send email to a single recipient with optional attachment via Brevo
const sendEmail = async (recipient, subject, html, attachmentPath = null) => {
  console.log('\n========== SENDING EMAIL ==========');
  console.log('Recipient:', recipient);
  console.log('Subject:', subject);
  console.log('Has attachment path:', !!attachmentPath);
  
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || undefined
  };
  
  sendSmtpEmail.to = [{ email: recipient }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;

  // Add attachment if provided
  if (attachmentPath) {
    console.log('Attachment path provided:', attachmentPath);
    
    if (fs.existsSync(attachmentPath)) {
      try {
        // Check file details before encoding
        const fileStats = fs.statSync(attachmentPath);
        console.log('File stats:', {
          path: attachmentPath,
          size: fileStats.size,
          isFile: fileStats.isFile()
        });
        
        if (fileStats.size === 0) {
          console.error('❌ WARNING: File size is 0 bytes! File may be corrupted.');
        }
        
        // Create attachment
        const attachment = fileToBase64Attachment(attachmentPath);
        sendSmtpEmail.attachment = [attachment];
        
        console.log('✅ Attachment successfully added to email');
        console.log('Attachment details:', {
          name: attachment.name,
          contentLength: attachment.content.length,
          estimatedSize: `${Math.round(attachment.content.length * 0.75 / 1024)} KB`
        });
        
      } catch (attachError) {
        console.error('❌ Error adding attachment:', attachError.message);
        throw new Error(`Failed to attach file: ${attachError.message}`);
      }
    } else {
      console.error('❌ ERROR: Attachment file does not exist at path:', attachmentPath);
      console.error('Current working directory:', process.cwd());
      throw new Error(`Attachment file not found: ${attachmentPath}`);
    }
  } else {
    console.log('No attachment for this email');
  }

  try {
    console.log('📤 Calling Brevo API...');
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo');
    debugLog('Brevo API Response:', result);
    console.log('===================================\n');
    return result;
  } catch (error) {
    console.error('❌ Brevo API Error:', error.message);
    if (error.response?.body) {
      console.error('API Error Details:', JSON.stringify(error.response.body, null, 2));
    }
    console.log('===================================\n');
    throw error;
  }
};

// Log email sending result to database
const logEmailResult = async (email, subject, status, errorMessage = null) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      email,
      subject,
      status, // 'success' or 'failed' or 'skipped' or 'campaign_summary'
      error_message: errorMessage,
      sent_at: timestamp
    };

    const { data, error } = await supabase
      .from('email_logs')
      .insert([logEntry]);
    
    if (error) {
      console.error('Failed to log email result to database:', error);
      if (!global.emailLogs) {
        global.emailLogs = [];
      }
      global.emailLogs.push(logEntry);
    }
    
    return logEntry;
  } catch (error) {
    console.error('Error logging email result:', error);
    return null;
  }
};

// Process the request with multer file upload middleware
const processFileUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    resumeUpload(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Check if email has already been sent successfully
const checkIfEmailAlreadySent = async (email, subject) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('email', email)
      .eq('subject', subject)
      .eq('status', 'success')
      .limit(1);
    
    if (error) {
      console.error('Error checking email log:', error);
      if (global.emailLogs) {
        const found = global.emailLogs.find(log => 
          log.email === email && 
          log.subject === subject && 
          log.status === 'success'
        );
        return !!found;
      }
      return false;
    }
    
    return data && data.length > 0;
    
  } catch (error) {
    console.error('Error checking if email was already sent:', error);
    return false;
  }
};

const getEmailLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching email logs:', error);
      const memoryLogs = global.emailLogs || [];

      const successfulEmails = memoryLogs
        .filter(log => log.status === 'success')
        .map(log => log.email);

      const skippedEmails = memoryLogs
        .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
        .map(log => log.email);

      return res.status(200).json({
        success: true,
        data: memoryLogs,
        successfulEmails,
        skippedEmails,
        source: 'memory'
      });
    }

    const successfulEmails = data
      .filter(log => log.status === 'success')
      .map(log => log.email);

    const skippedEmails = data
      .filter(log => log.status === 'failed' && log.error_message && log.error_message.includes('SKIPPED:'))
      .map(log => log.email);

    return res.status(200).json({
      success: true,
      data: data,
      successfulEmails,
      skippedEmails,
      source: 'database'
    });
  } catch (error) {
    console.error('Server error fetching logs:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

// Controller for sending emails to all recipients in DB
const sendEmailsToAll = async (req, res) => {
  let tempResumePath = null; // Track temp file for cleanup
  
  try {
    // First, process any file upload (resume)
    try {
      await processFileUpload(req, res);
    } catch (uploadError) {
      return res.status(400).json({
        success: false,
        error: `File upload error: ${uploadError.message}`
      });
    }

    const emailSubject = req.body.subject;
    const emailContent = req.body.content;
    
    if (!emailSubject || !emailContent) {
      return res.status(400).json({
        success: false,
        error: 'Email subject and content are required'
      });
    }

    // Get resume path - from upload or Supabase storage
    let resumePath = null;
    let needsCleanup = false;
    
    // FIRST: Validate uploaded file if present
    if (req.file) {
      const stats = fs.existsSync(req.file.path) ? fs.statSync(req.file.path) : null;
      
      if (!stats || stats.size < 5000) {
        // File is corrupted or too small (< 5KB)
        console.error(`❌ REJECTING corrupted upload: ${stats ? stats.size : 0} bytes`);
        
        // Delete corrupted file
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        // Try to use Supabase storage instead
        if (!req.body.resumeFileName && !req.body.resumeStoragePath) {
          return res.status(400).json({
            success: false,
            error: `Uploaded file is corrupted (${stats ? stats.size : 0} bytes). Expected 10KB-500KB.`,
            hint: 'Frontend is not sending file correctly. Provide resumeFileName to use Supabase storage instead.',
            actualSize: stats ? stats.size : 0,
            expectedMinimum: 5000
          });
        }
        
        console.log('⚠️  Will attempt Supabase storage instead of corrupted upload');
      }
    }
    
    // SECOND: Get valid resume path
    const resumeResult = await getResumePath(req);
    resumePath = resumeResult.path;
    needsCleanup = resumeResult.isTemp;
    
    console.log('\n========== FILE UPLOAD DIAGNOSTIC ==========');
    // Debug file upload
    if (req.file) {
      console.log('✅ File received by server (uploaded)');
      console.log('File details:', {
        originalName: req.file.originalname,
        savedAs: req.file.filename,
        path: req.file.path,
        size: `${req.file.size} bytes (${(req.file.size / 1024).toFixed(2)} KB)`,
        mimetype: req.file.mimetype,
        encoding: req.file.encoding
      });
      
      // Verify file exists and has content
      if (fs.existsSync(req.file.path)) {
        const stats = fs.statSync(req.file.path);
        console.log(`✅ File verified on disk: ${stats.size} bytes`);
        
        if (stats.size === 0) {
          console.error('❌ CRITICAL: File is 0 bytes - not uploaded correctly from frontend!');
        } else if (stats.size < 1000) {
          console.warn('⚠️  WARNING: File very small (<1KB) - may be corrupted');
        }
        
        // Verify file content
        const buffer = fs.readFileSync(req.file.path);
        console.log('First 10 bytes (hex):', buffer.slice(0, 10).toString('hex'));
        
        if (req.file.mimetype === 'application/pdf') {
          const isPDF = buffer.slice(0, 4).toString() === '%PDF';
          console.log(isPDF ? '✅ Valid PDF' : '❌ Invalid PDF - corrupted!');
        }
      } else {
        console.error('❌ CRITICAL: File not found on disk!');
      }
    } else if (resumeFileName) {
      console.log('✅ Using resume from Supabase Storage:', resumeFileName);
    } else {
      console.log('ℹ️  No file - Check frontend: enctype="multipart/form-data", field="resume"');
      console.log('   OR send "resumeFileName" in request body to use Supabase Storage');
    }
    console.log('===========================================\n');

    // Get all ACTIVE emails
    let emails = [];
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('email')
        .eq('active', 1);
      
      if (error && error.code === '42P01') {
        emails = emailStorage
          .filter(item => item.active === 1)
          .map(item => item.email);
      } else if (error) {
        throw error;
      } else {
        emails = data.map(item => item.email);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${dbError.message}`
      });
    }

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active emails found to send to'
      });
    }

    console.log(`Preparing to send emails to ${emails.length} active recipients`);
    console.log(`Email subject: ${emailSubject}`);
    console.log(`Email content: ${emailContent.substring(0, 100)}...`);
    if (resumePath) {
      console.log(`Attaching resume: ${resumePath}`);
    }

    const results = { 
      success: [], 
      failed: [],
      skipped: []
    };
    
    const campaignId = Date.now().toString();
    
    const getRandomDelay = () => {
      const minDelay = 420000; // 7 min
      const maxDelay = 600000; // 10 min
      return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    };

    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      const alreadySent = await checkIfEmailAlreadySent(email, emailSubject);
      if (alreadySent) {
        console.log(`⏭️ Skipping email to ${email}: already sent successfully`);
        results.skipped.push(email);
        await logEmailResult(email, emailSubject, 'skipped', 'Email already sent successfully');
        continue;
      }
      
      try {
        await sendEmail(email, emailSubject, emailContent, resumePath);
        results.success.push(email);
        console.log(`✅ Email sent successfully to: ${email}`);
        await logEmailResult(email, emailSubject, 'success');
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error.message);
        const errorMsg = error.response?.body ? 
          JSON.stringify(error.response.body) : error.message;
        results.failed.push({ email, error: errorMsg });
        await logEmailResult(email, emailSubject, 'failed', errorMsg);
      }
      
      if (i < emails.length - 1) {
        const delayMs = getRandomDelay();
        const delayMinutes = (delayMs / 60000).toFixed(1);
        console.log(`Waiting ${delayMinutes} minutes (${delayMs}ms) before sending the next email...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    await logEmailResult(
      process.env.BREVO_SENDER_EMAIL, 
      `Campaign Summary: ${emailSubject}`,
      'campaign_summary', 
      JSON.stringify({
        campaignId,
        totalEmails: emails.length,
        successful: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      })
    );

    if (resumePath && fs.existsSync(resumePath)) {
      try {
        if (needsCleanup || resumePath.includes('temp_downloads')) {
          cleanupTempFile(resumePath);
        } else {
          fs.unlinkSync(resumePath);
          console.log(`Deleted temporary file: ${resumePath}`);
        }
      } catch (deleteError) {
        console.error(`Error deleting file: ${deleteError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      sentCount: results.success.length,
      failedCount: results.failed.length,
      skippedCount: results.skipped.length,
      totalAttempted: emails.length,
      campaignId,
      resumeSource: needsCleanup ? 'supabase_storage' : (resumePath ? 'upload' : 'none'),
      failedEmails: results.failed.length > 0 ? results.failed : undefined,
      skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
    });
    
  } catch (error) {
    console.error('Server error:', error);
    
    // Clean up temp file on error
    if (resumePath && needsCleanup) {
      cleanupTempFile(resumePath);
    }
    
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

// Secondary multer storage for single email upload endpoint
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

const uploadMiddleware = upload.single('file');

// Controller for sending an email to a single recipient
const sendSingleEmail = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({
        success: false,
        error: `File upload error: ${err.message}`
      });
    }

    try {
      let resumePath = null;
      let needsCleanup = false;
      
      if (req.file) {
        console.log(`File uploaded successfully to: ${req.file.path}`);
        console.log('File details:', {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        // Verify and validate file
        if (fs.existsSync(req.file.path)) {
          const stats = fs.statSync(req.file.path);
          console.log(`File verified on disk: ${stats.size} bytes`);
          
          // Validate file size
          if (stats.size < 5000) {
            console.error(`❌ REJECTING corrupted file: ${stats.size} bytes`);
            fs.unlinkSync(req.file.path);
            
            // Check if Supabase storage option provided
            if (!req.body.resumeFileName && !req.body.resumeStoragePath) {
              return res.status(400).json({
                success: false,
                error: `Uploaded file is corrupted (${stats.size} bytes). Expected minimum 5KB.`,
                hint: 'Provide resumeFileName to use file from Supabase storage instead.',
                actualSize: stats.size
              });
            }
            console.log('⚠️  Will use Supabase storage instead');
            resumePath = null; // Clear corrupted path
          } else {
            resumePath = req.file.path;
          }
        }
      }
      
      // Try Supabase storage if no valid upload
      if (!resumePath) {
        const resumeResult = await getResumePath(req);
        resumePath = resumeResult.path;
        needsCleanup = resumeResult.isTemp;
      }

      const { subject, content, recipients: recipientsInput } = req.body;
      console.log('Received form data:', {
        subject,
        content,
        recipientsInput
      });

      let recipients;
      if (typeof recipientsInput === 'string') {
        try {
          recipients = JSON.parse(recipientsInput);
        } catch (e) {
          recipients = [recipientsInput];
        }
      } else {
        recipients = recipientsInput;
      }

      if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
        if (resumePath && fs.existsSync(resumePath)) {
          fs.unlinkSync(resumePath);
        }
        return res.status(400).json({
          success: false,
          error: 'Email subject, content, and at least one recipient are required'
        });
      }

      const recipient = recipients[0];
      console.log(`Preparing to send email to: ${recipient}`);
      console.log(`Email subject: ${subject}`);
      console.log(`Email content: ${content.substring(0, 100)}...`);

      try {
        const alreadySent = await checkIfEmailAlreadySent(recipient, subject);
        if (alreadySent) {
          console.log(`⏭️ Skipping email to ${recipient}: already sent successfully`);
          if (resumePath && fs.existsSync(resumePath)) {
            fs.unlinkSync(resumePath);
          }
          
          return res.status(200).json({
            success: true,
            message: `Email to ${recipient} was already sent successfully`,
            status: 'skipped'
          });
        }

        await sendEmail(recipient, subject, content, resumePath);
        await logEmailResult(recipient, subject, 'success');
        console.log(`✅ Email sent successfully to: ${recipient}`);
        
        if (resumePath && fs.existsSync(resumePath)) {
          try {
            if (needsCleanup) {
              cleanupTempFile(resumePath);
            } else {
              fs.unlinkSync(resumePath);
              console.log(`Deleted temporary file: ${resumePath}`);
            }
          } catch (deleteError) {
            console.error(`Error deleting file: ${deleteError.message}`);
          }
        }
        
        return res.status(200).json({
          success: true,
          message: `Email sent successfully to ${recipient}`,
          resumeSource: needsCleanup ? 'supabase_storage' : 'upload'
        });
      } catch (error) {
        console.error(`❌ Failed to send email to ${recipient}:`, error.message);
        const errorMsg = error.response?.body ? 
          JSON.stringify(error.response.body) : error.message;
        await logEmailResult(recipient, subject, 'failed', errorMsg);
        if (resumePath && fs.existsSync(resumePath)) {
          if (needsCleanup) {
            cleanupTempFile(resumePath);
          } else {
            fs.unlinkSync(resumePath);
          }
        }
        return res.status(500).json({
          success: false,
          error: `Failed to send email: ${errorMsg}`
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({
        success: false,
        error: `Server error: ${error.message}`
      });
    }
  });
};

// Delete a single email log
const deleteEmailLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('email_logs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting email log:', error);
      if (global.emailLogs) {
        const index = global.emailLogs.findIndex(log => log.id === id);
        if (index !== -1) {
          global.emailLogs.splice(index, 1);
          return res.status(200).json({
            success: true,
            message: 'Log deleted successfully from memory'
          });
        }
      }
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

// Delete all email logs
const deleteAllEmailLogs = async (req, res) => {
  try {
    console.log('Starting deletion of all email logs...');
    const { data, error } = await supabase.rpc('truncate_email_logs');
    
    if (error) {
      console.error('Error deleting all email logs:', error);
      const { error: deleteError } = await supabase.from('email_logs').delete();
      if (deleteError) {
        console.error('Fallback deletion also failed:', deleteError);
        return res.status(500).json({
          success: false,
          error: `Could not delete logs: ${deleteError.message}`
        });
      }
    }
    
    if (global.emailLogs) {
      global.emailLogs = [];
    }
    
    console.log('Successfully deleted all email logs');
    return res.status(200).json({
      success: true,
      message: 'All email logs deleted successfully'
    });
  } catch (error) {
    console.error('Server error during log deletion:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

const batchDeleteLogs = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid array of email log IDs is required'
      });
    }
    
    try {
      const { error } = await supabase
        .from('email_logs')
        .delete()
        .in('id', ids);
      
      if (error) {
        if (error.code === '42P01') {
          return res.status(404).json({
            success: false,
            error: 'Email logs table does not exist and in-memory storage is not initialized',
            suggestion: 'Create an email_logs table in your database'
          });
        } else {
          throw error;
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `${ids.length} email logs deleted successfully`,
        source: 'database'
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${dbError.message}`
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

// Get list of available resumes from Supabase Storage
const getAvailableResumes = async (req, res) => {
  try {
    console.log('Fetching available resumes from Supabase Storage...');
    
    const bucketName = req.query.bucket || 'resumes';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('Error fetching resumes:', error);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch resumes: ${error.message}`
      });
    }
    
    // Filter out folders, only return files
    const files = data.filter(item => item.id !== null);
    
    console.log(`Found ${files.length} resume(s) in Supabase Storage`);
    
    return res.status(200).json({
      success: true,
      bucket: bucketName,
      count: files.length,
      resumes: files.map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        sizeKB: Math.round((file.metadata?.size || 0) / 1024),
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        mimeType: file.metadata?.mimetype || 'application/pdf'
      }))
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

/*
=============================================================================
EXPORTED FUNCTIONS - ADD TO YOUR SERVER.JS ROUTES:
=============================================================================

// Main email endpoints
app.post('/send-emails-to-all', emailController.sendEmailsToAll);
app.post('/send-email', emailController.sendSingleEmail);

// Log management
app.get('/email-logs', emailController.getEmailLogs);
app.delete('/email-logs/:id', emailController.deleteEmailLog);
app.delete('/email-logs', emailController.deleteAllEmailLogs);
app.post('/email-logs/batch-delete', emailController.batchDeleteLogs);

// Resume management
app.get('/available-resumes', emailController.getAvailableResumes);

// Testing endpoint - USE THIS TO DEBUG ATTACHMENT ISSUES
app.post('/test-attachment', 
  emailController.uploadMiddleware, 
  emailController.testBrevoAttachment
);

USAGE WITH SUPABASE RESUMES:
Instead of uploading file via form, send resumeFileName in body:

POST /send-emails-to-all
{
  "subject": "Job Application",
  "content": "<html>Your email</html>",
  "resumeFileName": "nawees_frontend_developer.pdf"
}

Get list of available resumes:
GET /available-resumes

QUICK DEBUG CHECKLIST:
□ Environment variables set (BREVO_API_KEY, BREVO_SENDER_EMAIL)
□ Sender email verified in Brevo dashboard
□ Frontend form has enctype="multipart/form-data"
□ Frontend using fileInput.files[0], not file path string
□ Field name matches ('resume' for bulk, 'file' for single)
□ OR use resumeFileName to fetch from Supabase Storage
□ Test endpoint works: POST /test-attachment with file
□ Check server logs for "FILE UPLOAD DIAGNOSTIC" section
□ File size in logs is NOT 0 or <1KB
=============================================================================
*/

module.exports = {
  sendEmailsToAll,
  sendSingleEmail,
  getEmailLogs,
  deleteEmailLog,
  deleteAllEmailLogs,
  batchDeleteLogs,
  getAvailableResumes,
 
};

