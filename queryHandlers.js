const { supabase, emailStorage } = require('./emailHandlers');

// Get paginated and filtered emails
const getPaginatedEmails = async (req, res) => {
  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 1000;
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;
    
    // Ensure proper content type
    res.setHeader('Content-Type', 'application/json');
    
    let data = [];
    let count = 0;
    let source = '';
    
    try {
      // Try to use Supabase if available
      const query = supabase.from('emails').select('*', { count: 'exact' });
      
      // Add search filter if provided
      if (search) {
        query.ilike('email', `%${search}%`);
      }
      
      // Get paginated results
      const { data: supabaseData, error, count: totalCount } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, use in-memory data
          const filteredEmails = search 
            ? emailStorage.filter(item => item.email.toLowerCase().includes(search.toLowerCase())) 
            : emailStorage;
            
          data = filteredEmails.slice(offset, offset + pageSize);
          count = filteredEmails.length;
          source = 'memory';
        } else {
          // Other database error
          throw error;
        }
      } else {
        // Supabase returned data successfully
        data = supabaseData;
        count = totalCount;
        source = 'database';
      }
      
      // Send successful response
      return res.status(200).json({
        success: true,
        data,
        total: count,
        page,
        pageSize,
        source
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

// Get test emails
const getTestEmails = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  const testData = {
    success: true,
    data: [
      { email: 'test1@example.com', id: '1' },
      { email: 'test2@example.com', id: '2' }
    ],
    total: 2,
    page: 1,
    pageSize: 10
  };
  
  return res.json(testData);
};

// Get all emails
const getAllEmails = async (req, res) => {
  try {
    // Try to get data from Supabase first
    const { data, error } = await supabase
      .from('emails')
      .select('*');
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, return in-memory data
      return res.status(200).json({
        success: true,
        source: 'memory',
        data: emailStorage
      });
    } else if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Return database data
    return res.status(200).json({
      success: true,
      source: 'database',
      data: data
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: error.message });
  }
};

// Simple health check endpoint
const healthCheck = (req, res) => {
  res.status(200).json({ status: 'ok' });
};

// Guide for creating table
const setupGuide = (req, res) => {
  res.status(200).json({
    message: "Your Supabase database needs setup",
    instructions: [
      "1. Go to your Supabase project dashboard",
      "2. Go to the SQL Editor section",
      "3. Run the following SQL to create the emails table:",
      `
        CREATE TABLE public.emails (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      "4. Make sure your API key has permission to access this table"
    ]
  });
};
const deleteEmail = async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Email ID is required'
        });
      }
      
      // Try to delete from Supabase
      try {
        const { error } = await supabase
          .from('emails')
          .delete()
          .eq('id', id);
        
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, delete from in-memory storage
            const initialLength = emailStorage.length;
            const emailIndex = emailStorage.findIndex(email => email.id === id);
            
            if (emailIndex === -1) {
              return res.status(404).json({
                success: false,
                error: 'Email not found'
              });
            }
            
            emailStorage.splice(emailIndex, 1);
            
            return res.status(200).json({
              success: true,
              message: 'Email deleted successfully',
              source: 'memory'
            });
          } else {
            // Other database error
            throw error;
          }
        }
        
        // Successfully deleted from database
        return res.status(200).json({
          success: true,
          message: 'Email deleted successfully',
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

  // Add this new route specifically for batch operations
// It should be defined BEFORE your '/:id' parameter route to avoid conflicts

// DELETE all emails - Use a completely different route path
  
  // If you need a function to call from elsewhere in your code
// Delete all emails
const deleteAllEmails = async (req, res) => {
    try {
      // Try to delete from Supabase
      try {
        // Instead of using the complex condition that's causing the error,
        // let's use a simpler approach to delete all records
        const { error } = await supabase
          .from('emails')
          .delete()
          .gt('id', '00000000-0000-0000-0000-000000000000'); // This will match all valid UUIDs
        
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, clear in-memory storage
            const initialCount = emailStorage.length;
            emailStorage.length = 0;
            
            return res.status(200).json({
              success: true,
              message: `${initialCount} emails deleted successfully`,
              source: 'memory'
            });
          } else {
            // Other database error
            throw error;
          }
        }
        
        // Successfully deleted from database
        return res.status(200).json({
          success: true,
          message: 'All emails deleted successfully',
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
  };  // Export the new functions
  const toggleEmailStatus = async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Email ID is required'
        });
      }
      
      try {
        // First, get the current status
        let currentStatus = null;
        let source = 'database';
        
        // Try to get from Supabase
        const { data, error } = await supabase
          .from('emails')
          .select('active')
          .eq('id', id)
          .single();
        
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, use in-memory storage
            const emailIndex = emailStorage.findIndex(email => email.id === id);
            
            if (emailIndex === -1) {
              return res.status(404).json({
                success: false,
                error: 'Email not found'
              });
            }
            
            // Get current status from memory (add default if not exists)
            currentStatus = emailStorage[emailIndex].active !== undefined ? 
              emailStorage[emailIndex].active : 1;
            source = 'memory';
          } else {
            throw error;
          }
        } else {
          // Data found in database
          currentStatus = data.active !== undefined ? data.active : 1;
        }
        
        // Toggle the status (0 -> 1, 1 -> 0, or null/undefined -> 0)
        const newStatus = currentStatus === 1 ? 0 : 1;
        
        // Update the record
        if (source === 'database') {
          const { error: updateError } = await supabase
            .from('emails')
            .update({ active: newStatus })
            .eq('id', id);
            
          if (updateError) throw updateError;
        } else {
          // Update in memory
          emailStorage[emailIndex].active = newStatus;
        }
        
        return res.status(200).json({
          success: true,
          message: `Email ${newStatus === 1 ? 'enabled' : 'disabled'} successfully`,
          data: { id, active: newStatus },
          source
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
  


// Add this function to your controller file (where deleteEmail and deleteAllEmails are defined)

const deleteDuplicateEmails = async (req, res) => {
  try {
    let source = 'database';
    let deletedCount = 0;
    
    // Try to delete duplicates from Supabase
    try {
      // With Supabase, we need to first identify duplicates, then delete them
      const { data, error } = await supabase
        .from('emails')
        .select('email, id')
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, handle in-memory duplicates
          const seenEmails = new Map();
          const duplicateIds = [];
          
          // First pass: identify duplicates (keeping the oldest entries)
          emailStorage.forEach(email => {
            if (!seenEmails.has(email.email)) {
              seenEmails.set(email.email, email.id);
            } else {
              duplicateIds.push(email.id);
            }
          });
          
          // Remove the duplicates
          const initialLength = emailStorage.length;
          emailStorage = emailStorage.filter(email => !duplicateIds.includes(email.id));
          deletedCount = initialLength - emailStorage.length;
          
          source = 'memory';
        } else {
          // Other database error
          throw error;
        }
      } else {
        // Successfully retrieved data from database
        // Group by email and keep the oldest entry (first in the sorted result)
        const emailGroups = {};
        const duplicateIds = [];
        
        data.forEach(record => {
          const email = record.email.toLowerCase(); // Case-insensitive comparison
          
          if (!emailGroups[email]) {
            emailGroups[email] = record.id;
          } else {
            duplicateIds.push(record.id);
          }
        });
        
        // Delete the duplicates if any were found
        if (duplicateIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('emails')
            .delete()
            .in('id', duplicateIds);
            
          if (deleteError) throw deleteError;
          
          deletedCount = duplicateIds.length;
        }
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: `${deletedCount} duplicate emails deleted successfully`,
        source,
        deletedCount
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
// Add this function to your controller file with the other email handling functions

const markEmailAsReplied = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { notes, emailAddress: providedEmailAddress } = req.body; // Optional manual email address
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        error: 'Email ID is required'
      });
    }
    
    // Create reply data
    let replyData = {
      email_id: emailId,
      replied_at: new Date().toISOString(),
      notes: notes || null,
    };
    
    // Use email address from request body if provided
    if (providedEmailAddress && typeof providedEmailAddress === 'string' && providedEmailAddress.includes('@')) {
      replyData.email_address = providedEmailAddress;
      console.log('Using provided email address:', providedEmailAddress);
    } else {
      // Try to find email address from the emails table
      try {
        // First try with a full select to get all possible fields
        const { data: fullData, error: fullError } = await supabase
          .from('emails')
          .select('*')
          .eq('id', emailId)
          .single();
        
        if (!fullError && fullData) {
          console.log('Full email data found:', JSON.stringify(fullData));
          
          // Try common email field names first
          const commonFields = ['email_address', 'email', 'emailAddress', 'sender', 'from', 'recipient'];
          let foundEmailAddress = null;
          
          // Check common fields first
          for (const field of commonFields) {
            if (fullData[field] && typeof fullData[field] === 'string' && fullData[field].includes('@')) {
              foundEmailAddress = fullData[field];
              console.log(`Found email address in field '${field}':`, foundEmailAddress);
              break;
            }
          }
          
          // If not found in common fields, scan all string fields
          if (!foundEmailAddress) {
            for (const [key, value] of Object.entries(fullData)) {
              if (typeof value === 'string' && value.includes('@')) {
                foundEmailAddress = value;
                console.log(`Found email address in field '${key}':`, foundEmailAddress);
                break;
              }
            }
          }
          
          if (foundEmailAddress) {
            replyData.email_address = foundEmailAddress;
          } else {
            console.warn('Could not find email address in the data');
          }
        } else if (fullError) {
          console.warn('Error fetching email data:', fullError.message);
          
          // Check in-memory storage if database fails
          if (typeof emailStorage !== 'undefined') {
            const emailData = emailStorage.find(email => email.id === emailId);
            if (emailData) {
              const emailAddress = emailData.email_address || emailData.email || emailData.emailAddress || null;
              if (emailAddress) {
                replyData.email_address = emailAddress;
                console.log('Found email address in memory storage:', emailAddress);
              }
            }
          }
        }
      } catch (lookupError) {
        console.warn('Error looking up email:', lookupError.message);
        // Continue without email address if lookup fails
      }
    }
    
    // Insert reply record - first try with email_address if we have it
    if (replyData.email_address) {
      try {
        const { data: replyResult, error: replyError } = await supabase
          .from('replied_emails')
          .insert([replyData])
          .select();
        
        if (!replyError) {
          return res.status(200).json({
            success: true,
            message: 'Email marked as replied with email address',
            data: replyResult[0] || replyData
          });
        } else if (replyError.message && replyError.message.includes('email_address')) {
          // Column doesn't exist, remove it and try again
          console.log('email_address column not found, removing from data');
          delete replyData.email_address;
        } else {
          throw replyError; // Other error
        }
      } catch (insertError) {
        console.error('Error inserting with email address:', insertError.message);
        // Try without email_address if insert fails
        delete replyData.email_address;
      }
    }
    
    // Insert without email_address
    try {
      const { data: fallbackResult, error: fallbackError } = await supabase
        .from('replied_emails')
        .insert([replyData])
        .select();
        
      if (fallbackError) {
        throw fallbackError;
      }
      
      return res.status(200).json({
        success: true,
        message: 'Email marked as replied (without email address)',
        data: fallbackResult[0] || replyData
      });
    } catch (finalError) {
      console.error('Final insertion error:', finalError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${finalError.message}`
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
// Update your module.exports to include the new function
module.exports = {
  markEmailAsReplied,
  toggleEmailStatus,
  getPaginatedEmails,
  getTestEmails,
  getAllEmails,
  healthCheck,
  setupGuide,
  deleteEmail,
  deleteAllEmails,
  deleteDuplicateEmails, // Add the new function
};
