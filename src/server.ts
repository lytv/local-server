import cors from 'cors';
// Import dotenv and load environment variables from .env file
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import odbc from 'odbc';
import { z } from 'zod';

dotenv.config();

// Simple logger that can be replaced with a proper logging solution
const logger = {
  info: (message: string) => {
    if (process.env.NODE_ENV !== 'test') {
      // Using process.stdout.write instead of console.log to avoid ESLint warning
      process.stdout.write(`${message}\n`);
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(message, error);
    }
  },
};

// Request validation schema for queries
const queryRequestSchema = z.object({
  connectionString: z.string(),
  query: z.string().refine(
    query => query.trim().toUpperCase().startsWith('SELECT'),
    { message: 'Only SELECT queries are allowed' },
  ),
});

// Request validation schema for updates
const updateRequestSchema = z.object({
  connectionString: z.string(),
  query: z.string().refine(
    (query) => {
      const upperQuery = query.trim().toUpperCase();
      return (
        upperQuery.startsWith('UPDATE')
        || upperQuery.startsWith('INSERT')
        || upperQuery.startsWith('DELETE')
      );
    },
    { message: 'Only UPDATE, INSERT, or DELETE queries are allowed' },
  ),
});

// Request validation schema for stored procedures
const procedureRequestSchema = z.object({
  connectionString: z.string(),
  query: z.string().refine(
    (query) => {
      const upperQuery = query.trim().toUpperCase();
      return upperQuery.startsWith('EXEC') || upperQuery.startsWith('EXECUTE');
    },
    { message: 'Only EXEC or EXECUTE commands are allowed' },
  ),
});

// Request validation schema for dynamic SQL scripts
const scriptRequestSchema = z.object({
  connectionString: z.string(),
  script: z.string().optional(),
  query: z.string().optional(),
}).refine(data => data.script !== undefined || data.query !== undefined, {
  message: "Either 'script' or 'query' must be provided",
  path: ["script"],
});

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Health check endpoint
  app.get('/health', (_: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/query', async (req: Request, res: Response) => {
    try {
      // For debugging
      console.log("Query request received");
      
      // Allow any query for debugging purposes
      let { connectionString, query } = req.body;
      
      if (!connectionString || !query) {
        return res.status(400).json({
          error: 'Missing required parameters: connectionString and query'
        });
      }
      
      // Log query for debugging (without sensitive connection info)
      console.log("Executing query:", query);
      
      let connection;
      try {
        // Create connection
        console.log("Connecting to database...");
        connection = await odbc.connect(connectionString);
        console.log("Connected successfully");

        try {
          // Execute query
          console.log("Executing query...");
          const result = await connection.query(query);
          console.log("Query executed successfully");
          
          // Send results
          res.json({ rows: result });
        } catch (error) {
          const errorDetails = error instanceof Error ? 
            { message: error.message, stack: error.stack } : 'Unknown error';
          
          console.error('Query execution error:', errorDetails);
          
          res.status(500).json({
            error: `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: errorDetails
          });
        } finally {
          // Always close the connection if it was established
          if (connection) {
            try {
              await connection.close();
              console.log("Connection closed successfully");
            } catch (err) {
              console.error('Error closing connection:', err);
            }
          }
        }
      } catch (error) {
        const errorDetails = error instanceof Error ? 
          { message: error.message, stack: error.stack } : 'Unknown error';
        
        console.error('Connection error:', errorDetails);
        
        res.status(500).json({
          error: `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: errorDetails
        });
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? 
        { message: error.message, stack: error.stack } : 'Unknown error';
      
      console.error('Request processing error:', errorDetails);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: errorDetails
        });
      }
    }
  });

  app.post('/update', async (req: Request, res: Response) => {
    try {
      // Validate request
      const { connectionString, query } = updateRequestSchema.parse(req.body);

      let connection;
      try {
        // Create connection
        connection = await odbc.connect(connectionString);

        try {
          // Execute update query
          const result = await connection.query(query);

          // Handle the result - ODBC might return different properties for updates
          // We'll check for affected rows in a safe way
          let rowsAffected: number | null = null;

          if (result && typeof result === 'object') {
            // Try to access rowsAffected as a property that might exist
            rowsAffected = 'rowsAffected' in result && typeof result.rowsAffected === 'number'
              ? (result as any).rowsAffected
              : null;
          }

          // Send results with message
          res.json({
            success: true,
            message: rowsAffected !== null
              ? `Update completed successfully, ${rowsAffected} rows affected`
              : 'Update completed successfully',
            rowsAffected,
          });
        } catch (error) {
          logger.error('Update execution error:', error);
          res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to execute update',
          });
        } finally {
          // Always close the connection if it was established
          if (connection) {
            await connection.close().catch((err) => {
              logger.error('Error closing connection:', err);
            });
          }
        }
      } catch (error) {
        logger.error('Connection error:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to connect to database',
        });
      }
    } catch (error) {
      logger.error('Request processing error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to process request',
        });
      }
    }
  });

  app.post('/procedure', async (req: Request, res: Response) => {
    try {
      // Validate request
      const { connectionString, query } = procedureRequestSchema.parse(req.body);

      let connection;
      try {
        // Create connection
        connection = await odbc.connect(connectionString);

        try {
          // Execute stored procedure
          const result = await connection.query(query);

          // Handle results - stored procedures might return multiple result sets
          // or affected rows, depending on the stored procedure
          if (Array.isArray(result) && result.length > 0) {
            // If it's a result set with data, return it like a query
            res.json({ rows: result });
          } else {
            // If it's not a standard result set, examine what we got
            let rowsAffected: number | null = null;

            if (result && typeof result === 'object') {
              // Try to access rowsAffected as a property that might exist
              rowsAffected = 'rowsAffected' in result && typeof result.rowsAffected === 'number'
                ? (result as any).rowsAffected
                : null;
            }

            // Send results with message
            res.json({
              success: true,
              message: 'Stored procedure executed successfully',
              rowsAffected,
              data: result,
            });
          }
        } catch (error) {
          logger.error('Stored procedure execution error:', error);
          res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to execute stored procedure',
          });
        } finally {
          // Always close the connection if it was established
          if (connection) {
            await connection.close().catch((err) => {
              logger.error('Error closing connection:', err);
            });
          }
        }
      } catch (error) {
        logger.error('Connection error:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to connect to database',
        });
      }
    } catch (error) {
      logger.error('Request processing error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to process request',
        });
      }
    }
  });

  // New endpoint for dynamic SQL scripts
  app.post('/script', async (req: Request, res: Response) => {
    try {
      // Validate request
      const validatedData = scriptRequestSchema.parse(req.body);
      const { connectionString } = validatedData;
      // Use script if provided, otherwise use query
      // We can safely assert this is a string because our Zod schema ensures one of them exists
      const script = (validatedData.script || validatedData.query) as string;
      
      logger.info("Executing dynamic SQL script");
      
      let connection;
      try {
        // Create connection
        logger.info("Connecting to database...");
        connection = await odbc.connect(connectionString);
        logger.info("Connected successfully");

        try {
          // Execute the script
          logger.info("Executing SQL script...");
          const result = await connection.query(script);
          logger.info("SQL script executed successfully");
          
          // Handle different result types
          if (Array.isArray(result) && result.length > 0) {
            // If it's a result set with data
            res.json({ success: true, rows: result });
          } else {
            // If it's not a standard result set
            let rowsAffected: number | null = null;

            if (result && typeof result === 'object') {
              rowsAffected = 'rowsAffected' in result && typeof result.rowsAffected === 'number'
                ? (result as any).rowsAffected
                : null;
            }

            res.json({
              success: true,
              message: 'Dynamic SQL script executed successfully',
              rowsAffected,
              data: result,
            });
          }
        } catch (error) {
          const errorDetails = error instanceof Error ? 
            { message: error.message, stack: error.stack } : 'Unknown error';
          
          logger.error('Script execution error:', errorDetails);
          
          res.status(500).json({
            error: `Error executing script: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: errorDetails
          });
        } finally {
          // Always close the connection if it was established
          if (connection) {
            try {
              await connection.close();
              logger.info("Connection closed successfully");
            } catch (err) {
              logger.error('Error closing connection:', err);
            }
          }
        }
      } catch (error) {
        const errorDetails = error instanceof Error ? 
          { message: error.message, stack: error.stack } : 'Unknown error';
        
        logger.error('Connection error:', errorDetails);
        
        res.status(500).json({
          error: `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: errorDetails
        });
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? 
        { message: error.message, stack: error.stack } : 'Unknown error';
      
      logger.error('Request processing error:', errorDetails);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: errorDetails
        });
      }
    }
  });

  return app;
}

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = Number.parseInt(process.env.LOCAL_SQL_PORT || '3001', 10);
  const HOST = process.env.LOCAL_SQL_HOST || 'localhost';

  // Debug output to verify environment variables
  logger.info('Environment variables:');
  logger.info(`- LOCAL_SQL_PORT: ${process.env.LOCAL_SQL_PORT}`);
  logger.info(`- LOCAL_SQL_HOST: ${process.env.LOCAL_SQL_HOST}`);
  logger.info(`- Using HOST: ${HOST}, PORT: ${PORT}`);

  const app = createServer();

  // Ensure we're binding to the correct host
  const server = app.listen(PORT, HOST, () => {
    const address = server.address();
    if (address && typeof address === 'object') {
      logger.info(`Local SQL server listening on ${address.address}:${address.port}`);
    } else {
      logger.info(`Local SQL server listening on ${HOST}:${PORT}`);
    }
  });
}
