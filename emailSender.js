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


// emailSender.js
// Replaced Nodemailer SMTP with Brevo TransactionalEmailsApi

const { supabase, emailStorage } = require('./emailHandlers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Brevo SDK
const Brevo = require('@getbrevo/brevo');
const brevoApi = new Brevo.TransactionalEmailsApi();
// Set API key
brevoApi.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

// Helper to build Brevo attachment from a file path (base64)
const fileToBase64Attachment = (attachmentPath) => {
  const content = fs.readFileSync(attachmentPath).toString('base64');
  return {
    name: path.basename(attachmentPath),
    content, // base64 string
  };
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
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || undefined,
  };
  sendSmtpEmail.to = [{ email: recipient }];

  if (attachmentPath && fs.existsSync(attachmentPath)) {
    sendSmtpEmail.attachment = [fileToBase64Attachment(attachmentPath)];
  }

  // Send through Brevo Transactional Email API
  // Returns a promise resolving with API response (contains messageId, etc.)
  return brevoApi.sendTransacEmail(sendSmtpEmail);
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

    const resumePath = req.file ? req.file.path : null;

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
        results.failed.push({ email, error: error.message });
        await logEmailResult(email, emailSubject, 'failed', error.message);
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
        fs.unlinkSync(resumePath);
        console.log(`Deleted temporary file: ${resumePath}`);
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
      failedEmails: results.failed.length > 0 ? results.failed : undefined,
      skippedEmails: results.skipped.length > 0 ? results.skipped : undefined
    });
    
  } catch (error) {
    console.error('Server error:', error);
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
      if (req.file) {
        resumePath = req.file.path;
        console.log(`File uploaded successfully to: ${resumePath}`);
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
            fs.unlinkSync(resumePath);
            console.log(`Deleted temporary file: ${resumePath}`);
          } catch (deleteError) {
            console.error(`Error deleting file: ${deleteError.message}`);
          }
        }
        
        return res.status(200).json({
          success: true,
          message: `Email sent successfully to ${recipient}`
        });
      } catch (error) {
        console.error(`❌ Failed to send email to ${recipient}:`, error.message);
        await logEmailResult(recipient, subject, 'failed', error.message);
        if (resumePath && fs.existsSync(resumePath)) {
          fs.unlinkSync(resumePath);
        }
        return res.status(500).json({
          success: false,
          error: `Failed to send email: ${error.message}`
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

module.exports = {
  sendEmailsToAll,
  sendSingleEmail,
  getEmailLogs,
  deleteEmailLog,
  deleteAllEmailLogs,
  batchDeleteLogs
};


