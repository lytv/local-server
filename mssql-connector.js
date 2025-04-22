const express = require('express');
const cors = require('cors');
const sql = require('mssql');

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Parse connection string to config object
function parseConnectionString(connectionString) {
  const config = {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      charset: 'UTF-8'
    }
  };
  
  connectionString.split(';').forEach(pair => {
    const [key, value] = pair.split('=');
    if (!key || !value) return;
    
    const keyLower = key.trim().toLowerCase();
    const valueClean = value.trim();
    
    if (keyLower === 'server') {
      config.server = valueClean;
    } else if (keyLower === 'database') {
      config.database = valueClean;
    } else if (keyLower === 'user id' || keyLower === 'uid') {
      config.user = valueClean;
    } else if (keyLower === 'password' || keyLower === 'pwd') {
      config.password = valueClean;
    } else if (keyLower === 'trusted_connection' && valueClean.toLowerCase() === 'yes') {
      config.trustedConnection = true;
    }
  });
  
  // Handle trusted connection
  if (config.trustedConnection) {
    delete config.user;
    delete config.password;
    config.options.trustedConnection = true;
  }
  
  return config;
}

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok', message: 'MSSQL connector running' });
});

// Query endpoint
app.post('/query', async (req, res) => {
  const { connectionString, query } = req.body;
  
  if (!connectionString || !query) {
    return res.status(400).json({
      error: 'Missing required parameters: connectionString and query'
    });
  }
  
  console.log('Executing query:', query);
  
  try {
    // Parse connection string to config
    const config = parseConnectionString(connectionString);
    console.log('Connecting with config:', {
      ...config,
      password: config.password ? '****' : undefined
    });
    
    // Connect to database
    await sql.connect(config);
    console.log('Connected to database');
    
    // Execute query
    const result = await sql.query(query);
    console.log('Query executed successfully');
    
    // Close connection
    await sql.close();
    console.log('Connection closed');
    
    // Send results
    res.json({ rows: result.recordset });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        number: error.number
      }
    });
    
    // Make sure to close the connection on error
    try {
      await sql.close();
    } catch (e) {
      console.error('Error closing connection:', e);
    }
  }
});

// Handle updates and procedures as well
app.post('/update', async (req, res) => {
  const { connectionString, query } = req.body;
  
  if (!connectionString || !query) {
    return res.status(400).json({
      error: 'Missing required parameters: connectionString and query'
    });
  }
  
  console.log('Executing update:', query);
  
  try {
    // Parse connection string to config
    const config = parseConnectionString(connectionString);
    
    // Connect to database
    await sql.connect(config);
    console.log('Connected to database');
    
    // Execute query
    const result = await sql.query(query);
    console.log('Update executed successfully');
    
    // Close connection
    await sql.close();
    console.log('Connection closed');
    
    // Send results
    res.json({ 
      success: true,
      message: 'Update completed successfully',
      rowsAffected: result.rowsAffected[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        number: error.number
      }
    });
    
    // Make sure to close the connection on error
    try {
      await sql.close();
    } catch (e) {
      console.error('Error closing connection:', e);
    }
  }
});

app.post('/procedure', async (req, res) => {
  const { connectionString, query } = req.body;
  
  if (!connectionString || !query) {
    return res.status(400).json({
      error: 'Missing required parameters: connectionString and query'
    });
  }
  
  console.log('Executing procedure:', query);
  
  try {
    // Parse connection string to config
    const config = parseConnectionString(connectionString);
    
    // Connect to database
    await sql.connect(config);
    console.log('Connected to database');
    
    // Extract procedure name and parameters
    const execMatch = query.trim().match(/^EXEC(?:UTE)?\s+(\[?[^\s\[]+\]?)\s*(.*)$/i);
    
    if (!execMatch) {
      throw new Error('Invalid stored procedure format');
    }
    
    const procedureName = execMatch[1];
    const paramsString = execMatch[2];
    
    // Create a request object
    const request = new sql.Request();
    
    // Execute the stored procedure
    const result = await request.query(query);
    console.log('Procedure executed successfully');
    
    // Close connection
    await sql.close();
    console.log('Connection closed');
    
    // Send results
    res.json({ 
      rows: result.recordset,
      success: true,
      message: 'Stored procedure executed successfully',
      rowsAffected: result.rowsAffected[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        number: error.number
      }
    });
    
    // Make sure to close the connection on error
    try {
      await sql.close();
    } catch (e) {
      console.error('Error closing connection:', e);
    }
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`MSSQL connector running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /health: Health check');
  console.log('- POST /query: Execute SELECT queries');
  console.log('- POST /update: Execute UPDATE/INSERT/DELETE queries');
  console.log('- POST /procedure: Execute stored procedures');
});
