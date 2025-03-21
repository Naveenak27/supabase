const { supabase, emailStorage } = require('./emailHandlers');

// Get paginated and filtered emails
const getPaginatedEmails = async (req, res) => {
  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
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
  
  module.exports = {
    toggleEmailStatus,
    getPaginatedEmails,
    getTestEmails,
    getAllEmails,
    healthCheck,
    setupGuide,
    deleteEmail,       // Add this new export
    deleteAllEmails ,
  };

