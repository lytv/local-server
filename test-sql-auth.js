const odbc = require('odbc');

// Connection string with SQL Server authentication
const connectionString = "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ERPYamato;UID=sa;PWD=your_password_here;";

console.log("SQL Server Authentication Test");
console.log("==============================");
console.log(`Testing connection with: ${connectionString.replace(/PWD=.*?;/i, "PWD=******;")}`);

async function testConnection() {
  try {
    console.log("\nConnecting to database...");
    const connection = await odbc.connect(connectionString);
    console.log("✓ Connection successful!");

    console.log("\nTesting query...");
    const result = await connection.query(`
      SELECT [id], [dateCreate], [dateUpdate], [UserID], [stt], [soluonggiohan], [maso], [macongdoan], [mota] 
      FROM [ERPYamato].[dbo].[tblMaCongDoan]
    `);
    
    console.log("✓ Query successful!");
    console.log("Row count:", result.length);
    if (result.length > 0) {
      console.log("First row:", JSON.stringify(result[0], null, 2));
    }

    console.log("\nClosing connection...");
    await connection.close();
    console.log("Connection closed.");
  } catch (error) {
    console.error("\n✗ Connection error:", error.message);
    
    // Show ODBC specific errors if available
    if (error.odbcErrors) {
      console.error("\nODBC Errors:");
      error.odbcErrors.forEach((odbcError, index) => {
        console.error(`  Error ${index + 1}: State=${odbcError.state}, Code=${odbcError.code}`);
        console.error(`     Message: ${odbcError.message}`);
      });
    }
    
    // Provide solutions based on error types
    if (error.message.includes("Login failed")) {
      console.error("\nPossible solutions:");
      console.error("1. Verify the SQL Server username and password are correct");
      console.error("2. Make sure SQL Server is configured to allow SQL Server authentication");
      console.error("3. Confirm the SQL login has access to the ERPYamato database");
    } else if (error.message.includes("network-related") || error.message.includes("connect")) {
      console.error("\nPossible solutions:");
      console.error("1. Check if SQL Server is running");
      console.error("2. Verify the server name is correct (try using IP address)");
      console.error("3. Check firewall settings are allowing connections to SQL Server port (default 1433)");
    }
  }
}

testConnection().catch(err => {
  console.error("Unexpected error:", err);
}); 