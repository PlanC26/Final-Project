const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function storeImageAsBytea(issueId, fileName) {
  try {
    const filePath = path.join(__dirname, "uploads", fileName);

    // Read image as binary
    const imageBuffer = fs.readFileSync(filePath);

    // Update DB with bytea
    await pool.query(
      `UPDATE posts 
       SET imagefile = $1 
       WHERE post_id = $2`,
      [imageBuffer, issueId]
    );

    console.log(`✅ Image stored for issue ID: ${issueId}`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

// Example usage
storeImageAsBytea(4, "streetlight.jpg");
storeImageAsBytea(5, "garbage.jpg");
storeImageAsBytea(6, "leakage.jpg");