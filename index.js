require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Error handler middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);

  res.status(500).json({
    error: true,
    message: "An internal server error occurred",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Database configurations
const sourcePool = new Pool({
  host: process.env.SOURCE_DB_HOST,
  port: process.env.SOURCE_DB_PORT,
  user: process.env.SOURCE_DB_USER,
  password: process.env.SOURCE_DB_PASSWORD,
  database: process.env.SOURCE_DB_NAME,
});

const destPool = new Pool({
  host: process.env.DESTINATION_DB_HOST,
  port: process.env.DESTINATION_DB_PORT,
  user: process.env.DESTINATION_DB_USER,
  password: process.env.DESTINATION_DB_PASSWORD,
  database: process.env.DESTINATION_DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrateTable(table) {
  try {
    const sourceClient = await sourcePool.connect();
    console.log("Connected to source database");
    const destClient = await destPool.connect();
    console.log("Connected to destination database");
    // Get column names
    const columnsRes = await sourceClient.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1 
       ORDER BY ordinal_position`,
      [table]
    );
    const columns = columnsRes.rows.map((row) => row.column_name);

    // Get source data
    const dataRes = await sourceClient.query(`SELECT * FROM ${table}`);
    const rows = dataRes.rows;

    if (rows.length === 0) return;

    // Clear destination table
    await destClient.query(`TRUNCATE TABLE ${table}`);

    // Generate insert query
    const placeholders = rows
      .map(
        (_, i) =>
          `(${columns
            .map((_, j) => `$${i * columns.length + j + 1}`)
            .join(", ")})`
      )
      .join(", ");

    const query = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES ${placeholders}
    `;

    // Flatten parameters
    const params = rows.flatMap((row) => columns.map((col) => row[col]));

    // Insert data
    await destClient.query(query, params);
    console.log(`Migrated ${rows.length} rows to ${table}`);
  } finally {
    sourceClient.release();
    destClient.release();
  }
}

app.get("/", (req, res) => {
  try {
    console.log("Server is running");
    res.status(200).json({ message: "Server is running" });
  } catch (error) {
    console.error("Server failed:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/migrate", async (req, res) => {
  try {
    res.status(200).json({ message: "Migration completed successfully" });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/migrate", async (req, res) => {
  try {
    const client = await sourcePool.connect();
    console.log("Connected to source database");

    const tablesRes = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    client.release();

    console.log("Tables:", tablesRes.rows);

    const tables = tablesRes.rows.map((row) => row.table_name);

    console.log("Tables:", tables);

    for (const table of tables) {
      console.log("Migrating table:", table);
      await migrateTable(table);
    }

    res.status(200).json({ message: "Migration completed successfully" });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
