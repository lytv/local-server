# Local SQL Server for FMS

This is a local ExpressJS server that acts as a bridge between the frontend and SQL Server databases. It provides secure API endpoints to execute SQL queries, updates, and stored procedures.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

## Configuration

The server can be configured using environment variables:

- `LOCAL_SQL_HOST`: The host address to bind the server to (default: 'localhost')
- `LOCAL_SQL_PORT`: The port number to listen on (default: 3001)

You can set these variables in your environment or create a `.env` file in the project root.

## API Endpoints

The server provides the following endpoints:

- `GET /health`: Health check endpoint, returns `{ status: "ok" }` when the server is running
- `POST /query`: Executes SELECT queries
- `POST /update`: Executes UPDATE, INSERT, or DELETE queries
- `POST /procedure`: Executes stored procedures

## Request Format

All endpoint requests should include:

```json
{
  "connectionString": "Server=myserver;Database=mydatabase;User ID=myuser;Password=mypassword;",
  "query": "SELECT * FROM myTable"
}
```

## Response Format

The server returns responses in the following formats:

### Query Response
```json
{
  "rows": [
    { "column1": "value1", "column2": "value2" },
    { "column1": "value3", "column2": "value4" }
  ]
}
```

### Update Response
```json
{
  "success": true,
  "message": "Update completed successfully, 5 rows affected",
  "rowsAffected": 5
}
```

### Stored Procedure Response
For procedures that return data:
```json
{
  "rows": [
    { "column1": "value1", "column2": "value2" },
    { "column1": "value3", "column2": "value4" }
  ]
}
```

For procedures that don't return data:
```json
{
  "success": true,
  "message": "Stored procedure executed successfully",
  "rowsAffected": 3,
  "data": { /* any additional data returned */ }
}
```

## Error Handling

In case of errors, the server returns an appropriate HTTP status code along with an error message:

```json
{
  "error": "Failed to execute query",
  "details": [/* optional additional details */]
}
```

## Prerequisites

1. Node.js 14+ installed
2. ODBC drivers installed for your database system
3. Database connection details (server, database, credentials)

## Installation

1. Run the installation script:
```bash
node scripts/install-local-sql-server.js
```

2. This will:
   - Create the local-sql-server directory
   - Install required dependencies
   - Set up the server configuration

## Starting the Server

1. Navigate to the local server directory:
```bash
cd local-sql-server
```

2. Start the server:
```bash
npm start
```

The server will run on port 3001 by default. You can change this by setting the `LOCAL_SQL_PORT` environment variable.

## Usage

Once the server is running:

1. In the SQL Server Import interface, you can select "Client-side (ODBC)" mode
2. Enter your connection string and SQL query
3. The query will be executed through the local server using your system's ODBC drivers

## Security Notes

- The local server only accepts SELECT queries
- It runs on localhost only
- Connection strings and queries are validated before execution
- All database connections are properly closed after use

## Troubleshooting

1. If the client-side mode is disabled:
   - Check if the local server is running
   - Ensure ODBC drivers are installed
   - Check the server logs for errors

2. If you get connection errors:
   - Verify your connection string
   - Check if the ODBC driver is properly installed
   - Ensure the database is accessible from your machine

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the server logs
3. Contact your system administrator for ODBC driver issues
