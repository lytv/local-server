const odbc = require('odbc');

// Connection string to test
const connectionString = "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=ERPYamato;Trusted_Connection=Yes;";

console.log("ODBC Connection Test Utility");
console.log("============================");
console.log(`Testing connection with: ${connectionString}`);
console.log("ODBC Version:", odbc.version || "Unknown");

async function testConnection() {
  try {
    console.log("\nStep 1: Connecting to database...");
    const connection = await odbc.connect(connectionString);
    console.log("✓ Connection successful!");

    try {
      console.log("\nStep 2: Testing simple query...");
      const result = await connection.query("SELECT @@VERSION AS SQLVersion");
      console.log("✓ Query successful!");
      console.log("SQL Server Version:", result[0]?.SQLVersion || "Unknown");
      
      console.log("\nStep 3: Testing tblMaCongDoan table query...");
      try {
        const tableResult = await connection.query(`
          SELECT TOP 1 [id], [dateCreate], [dateUpdate], [UserID], [stt], [soluonggiohan], [maso], [macongdoan], [mota] 
          FROM [ERPYamato].[dbo].[tblMaCongDoan]
        `);

        console.log("✓ tblMaCongDoan query successful!");
        console.log("Column names:", Object.keys(tableResult[0] || {}).join(", "));
        console.log("Row count:", tableResult.length);
      } catch (tableError) {
        console.error("✗ Error querying tblMaCongDoan:", tableError.message);
        console.error("  Details:", tableError);
      }
    } finally {
      console.log("\nClosing connection...");
      await connection.close();
      console.log("Connection closed.");
    }
  } catch (error) {
    console.error("\n✗ Connection error:", error.message);
    console.error("  Full error details:", error);
    
    // Show specific advice based on error message
    if (error.message.includes("Data source name not found")) {
      console.error("\nPossible solution: ODBC driver might not be properly configured or installed.");
      console.error("1. Verify ODBC Driver 17 for SQL Server is installed.");
      console.error("2. Check if you can see the driver in ODBC Data Source Administrator.");
    } else if (error.message.includes("Login failed")) {
      console.error("\nPossible solution: Authentication issue.");
      console.error("1. Check username and password.");
      console.error("2. Verify SQL Server authentication mode (Windows vs SQL auth).");
    } else if (error.message.includes("network-related")) {
      console.error("\nPossible solution: Network or SQL Server instance issue.");
      console.error("1. Check if SQL Server is running.");
      console.error("2. Verify server name is correct.");
      console.error("3. Check firewall settings.");
    }
  }
}

testConnection().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
}); 