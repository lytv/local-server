const odbc = require('odbc');

// Replace this with your actual connection string
const connectionString = process.argv[2] || "Server=localhost;Database=ERPYamato;Trusted_Connection=Yes;";

console.log(`Testing connection with: ${connectionString.replace(/Password=.*;/i, "Password=*****;")}`);

async function testConnection() {
  try {
    console.log("Connecting to database...");
    const connection = await odbc.connect(connectionString);
    console.log("Connection successful!");
    
    try {
      console.log("Testing simple query...");
      const result = await connection.query("SELECT COUNT(*) AS TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'");
      console.log("Query successful!");
      console.log("Result:", JSON.stringify(result, null, 2));
      
      console.log("\nTesting tblMaCongDoan table query...");
      try {
        const tableResult = await connection.query("SELECT TOP 1 * FROM [dbo].[tblMaCongDoan]");
        console.log("tblMaCongDoan query successful!");
        console.log("Column names:", Object.keys(tableResult[0] || {}).join(", "));
        console.log("Row count:", tableResult.length);
      } catch (tableError) {
        console.error("Error querying tblMaCongDoan:", tableError.message);
      }
      
    } catch (queryError) {
      console.error("Query error:", queryError.message);
    } finally {
      console.log("Closing connection...");
      await connection.close();
      console.log("Connection closed.");
    }
  } catch (error) {
    console.error("Connection error:", error.message);
  }
}

testConnection().catch(err => {
  console.error("Unhandled error:", err);
});
