const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "plancnm26@gmail.com",
    pass: "xxx"   
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

/* ================= AUTH MIDDLEWARE ================= */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    req.user = user; // contains userId, username, email
    next();
  });
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
  });
  

  app.get('/api/test', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ 
        message: 'Database connection successful!', 
        timestamp: result.rows[0].now 
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ error: 'Database connection failed' });
    }
  });
  app.get("/api/admin/posts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT post_id, location, title, status
      FROM posts
      ORDER BY post_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});
app.put("/api/admin/posts/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE posts SET status = $1 WHERE post_id = $2",
      [status, id]
    );

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});
  


  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: 'All fields are required',
          errors: {
            username: !username ? 'Username is required' : '',
            email: !email ? 'Email is required' : '',
            password: !password ? 'Password is required' : ''
          }
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: 'Invalid email format',
          errors: { email: 'Please enter a valid email address' }
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Password too short',
          errors: { password: 'Password must be at least 6 characters long' }
        });
      }
      const existingUser = await pool.query(
        'SELECT * FROM "User" WHERE email = $1 OR username = $2',
        [email, username]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          message: 'User already exists',
          errors: { 
            general: 'A user with this email or username already exists' 
          }
        });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert new user - only specify columns that exist and are not auto-generated
      const result = await pool.query(
        'INSERT INTO "User" (username, email, password, creationdate, firebaseuid) VALUES ($1, $2, $3, NOW(), $4) RETURNING userid, username, email',
        [username, email, hashedPassword, req.body.firebaseuid || null]
      );
      res.status(201).json({ 
        message: 'User registered successfully!',
        user: {
          userid: result.rows[0].userid,
          username: result.rows[0].username,
          email: result.rows[0].email
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error.message 
      });
    }
  });
  app.post('/api/login', async (req, res) => {
    try {
      const { email, firebaseuid, password } = req.body;
      
      // Add debugging
      console.log('Login attempt:', { email, firebaseuid, password });
      
      // Validation

      if (!email || !password) {
        console.log('Validation failed: missing email');
        return res.status(400).json({ 
          message: 'Email and password are required',
          errors: {
            email: !email ? 'Email is required' : '',
            password: !password ? 'Password is required' : ''
          }
        });
      }
      
 // Find user by email
 console.log('Searching for user with email:', email, 'or firebaseuid:', firebaseuid);
 let result;
 if (firebaseuid) { result = await pool.query(
   'SELECT * FROM "User" WHERE email = $1 OR firebaseuid = $2',
   [email, firebaseuid]
 );
 } else {
  result = await pool.query(
    'SELECT * FROM "User" WHERE email = $1',
    [email]
 );
}
 
 console.log('Database query result:', result.rows.length, 'users found');
 
 if (result.rows.length === 0) {
   console.log('No user found with email:', email);
   return res.status(401).json({ 
     message: 'Invalid credentials',
     errors: { 
       general: 'Email or password is incorrect' 
     }
   });
 }
 
 const user = result.rows[0];
 if (user.disabled === true) {
  return res.status(423).json({
    message: 'Your account is under review. Please try again later.',
    code: 'ACCOUNT_DISABLED'
  });
}
console.log('Disabled flag raw:', user.disabled, typeof user.disabled);
 console.log('User found:', { userid: user.userid, username: user.username, email: user.email,firebaseuid: user.firebaseuid });
      
 if (firebaseuid && user.firebaseuid !== firebaseuid) {
  await pool.query(
    'UPDATE "User" SET firebaseuid = $1 WHERE userid = $2',
    [firebaseuid, user.userid]
  );
  console.log('Updated firebaseuid for user:', user.userid);
}


      console.log('Checking password...');
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', user.email);
        return res.status(401).json({ 
          message: 'Invalid credentials',
          errors: { 
            general: 'Email or password is incorrect' 
          }
        });
      }
      
      
    
      console.log('Login successful for user:', user.email);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userid, username: user.username,  email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        userid: user.userid,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});
// app.get('/api/reported-users', async (req, res) => {
//   try {
//     const sql = `
//       SELECT
//         r.reported_user_id AS reported_user_id,
//         u1.username AS reported_username,

//         r.reported_by AS reported_by_id,
//         u2.username AS reported_by_username,

//         r.reason,
//         r.created_at,
//         COALESCE(u1.disabled, false) AS disabled
//       FROM reports r
//       LEFT JOIN "User" u1 ON u1.userid = r.reported_user_id
//       LEFT JOIN "User" u2 ON u2.userid = r.reported_by
//       ORDER BY r.created_at DESC
//     `;

//     const { rows } = await pool.query(sql);
//     res.json(rows);

//   } catch (err) {
//     console.error('reported-users error:', err);
//     res.status(500).json({ message: 'Failed to fetch reported users' });
//   }
// });
// Get latest weekly report as PDF
app.get('/api/weekly-reports/latest', async (req, res) => {
  try {
    const query = `
      SELECT report_file
      FROM weekly
      ORDER BY generated_at DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No weekly report found' });
    }

    const reportBuffer = rows[0].report_file;

    if (!reportBuffer) {
      return res.status(404).json({ message: 'Report file is empty' });
    }

    // Set proper headers for PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="weekly-report.pdf"');
    res.setHeader('Content-Length', reportBuffer.length);

    res.send(reportBuffer);

  } catch (error) {
    console.error('Error fetching weekly report:', error);
    res.status(500).json({ message: 'Failed to fetch weekly report' });
  }
});




/* ================= GET ALL POSTS ================= */
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM posts ORDER BY createdate DESC'
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* ================= GET USER POSTS ================= */
app.get('/api/posts/user/:userid', async (req, res) => {
  try {

    const userId = parseInt(req.params.userid);

    const result = await pool.query(
      'SELECT * FROM posts WHERE userid = $1 ORDER BY createdate DESC',
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('User posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Delete post (only owner can delete)
app.delete('/api/posts/:id', async (req, res) => {
  try {

    // 1️⃣ Get post ID from URL
    const postId = req.params.id;

    // 2️⃣ Get user ID from request body
    const { userId } = req.body;

    // 3️⃣ Validate inputs
    if (!postId || !userId) {
      return res.status(400).json({
        message: "Missing post ID or user ID"
      });
    }

    // 4️⃣ Delete only if post belongs to user
    const result = await pool.query(
      `DELETE FROM posts
       WHERE post_id = $1 AND userid = $2
       RETURNING *`,
      [postId, userId]
    );

    // 5️⃣ If nothing deleted
    if (result.rowCount === 0) {
      return res.status(403).json({
        message: "Not authorized or post not found"
      });
    }

    // 6️⃣ Success response
    res.json({
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.get("/api/posts/image/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT imagefile FROM posts WHERE post_id = $1",
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", "image/jpeg"); // change if png
    res.send(result.rows[0].image_data);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
app.get("/api/map-posts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT post_id, title, status, mappointer
      FROM posts
      WHERE mappointer IS NOT NULL
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});
/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
const fs =require("fs")
/* ================= CREATE POST ================= */
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    const { userid, title, description, lat, lng } = req.body;

    if (!userid || !description || !lat || !lng) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageName = req.file ? req.file.filename : null;
    const imageBuffer = req.file 
        ? fs.readFileSync(req.file.path)   
        : null;
    //const location = `${lat},${lng}`;// 🔥 Reverse Geocoding
const geoRes = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
  {
    headers: {
      "User-Agent": "PlanC-App",
      "Accept": "application/json"
    }
  }
);

const geoData = await geoRes.json();
console.log("GeoData:", geoData);

const readableAddress =
  geoData.display_name || `${lat},${lng}`;

    const query = `
  INSERT INTO posts 
  (userid, title, description, image, image_file, location, mappointer, status, noofupvotes, createdate)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
  RETURNING *
`;

const result = await pool.query(query, [
  userid,
  title ,
  description,
  imageName,
  imageBuffer,
  readableAddress,   // 🔥 exact area name
  `${lat},${lng}`,   // store raw coordinates
  'Pending',
  0
]);

    res.status(201).json({
      message: 'Complaint registered successfully',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
/* ================= UPVOTE POST ================= */
app.put('/api/posts/:id/upvote', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userid } = req.body;

    if (!userid) {
      return res.status(400).json({ message: "User ID required" });
    }

    // Try to insert vote
    const voteInsert = await pool.query(
      `INSERT INTO post_votes (post_id, userid)
       VALUES ($1, $2)
       ON CONFLICT (post_id, userid) DO NOTHING
       RETURNING *`,
      [postId, userid]
    );

    // If new vote inserted → increment count
    if (voteInsert.rowCount > 0) {
      await pool.query(
        `UPDATE posts
         SET noofupvotes = noofupvotes + 1
         WHERE post_id = $1`,
        [postId]
      );
    }

    // Get updated vote count
    const updated = await pool.query(
      `SELECT noofupvotes FROM posts WHERE post_id = $1`,
      [postId]
    );

    res.json({
      upvotes: updated.rows[0].noofupvotes
    });

  } catch (err) {
    console.error("Upvote error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= ADD COMMENT ================= */
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userid, comment_text } = req.body;

    if (!userid || !comment_text) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, userid, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, userid, comment_text]
    );

    res.status(201).json({
      message: "Comment added",
      comment: result.rows[0]
    });

  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= GET COMMENTS ================= */
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;

    const result = await pool.query(
      `SELECT c.comment_id,
              c.comment_text,
              c.created_at,
              u.username
       FROM comments c
       JOIN "User" u ON c.userid = u.userid
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Fetch comments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= REPORT USER ================= */
app.post('/api/report-user', async (req, res) => {
  try {
    console.log("Report request body:", req.body);

    const { reportedUserId, reportedBy, reason } = req.body;

    if (!reportedUserId || !reportedBy || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prevent duplicate report
    const existing = await pool.query(
      `SELECT * FROM reports 
       WHERE reported_user_id = $1 AND reported_by = $2`,
      [reportedUserId, reportedBy]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You already reported this user' });
    }

    // Insert report
    await pool.query(
      `INSERT INTO reports (reported_user_id, reported_by, reason)
       VALUES ($1, $2, $3)`,
      [reportedUserId, reportedBy, reason]
    );

    /* ================= AUTO DISABLE CHECK ================= */

    const reportCountResult = await pool.query(
      `SELECT COUNT(*) FROM reports WHERE reported_user_id = $1`,
      [reportedUserId]
    );

    const reportCount = parseInt(reportCountResult.rows[0].count);

    if (reportCount >= 1) {

      // Only auto-disable if admin has not overridden
      await pool.query(
        `UPDATE "User"
         SET disabled = TRUE
         WHERE userid = $1
         AND manual_override = FALSE`,
        [reportedUserId]
      );

    }

    res.json({
      message: 'Report submitted successfully',
      reportCount
    });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Failed to submit report' });
  }
});
  
/* ================= GET REPORTED USERS FOR ADMIN ================= */
app.get('/api/reported-users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.reported_user_id,
        COUNT(*) AS total_reports,
        u.disabled,
        u.manual_override
      FROM reports r
      JOIN "User" u ON u.userid = r.reported_user_id
      GROUP BY r.reported_user_id, u.disabled, u.manual_override
      ORDER BY total_reports DESC
    `);


    res.json(result.rows);

  } catch (err) {
    console.error("Fetch reported users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/send-weekly-report", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT report_file
      FROM weekly
      ORDER BY generated_at DESC
      LIMIT 1
    `);

    if (!result.rows.length) {
      return res.status(404).json({ message: "No report found" });
    }

    const pdfBuffer = result.rows[0].report_file;

    await transporter.sendMail({
      from: "plancnm26@gmail.com",
      to: "braiviks@gmail.com",
      subject: "Weekly Report",
      text: "Please find the weekly report attached.",
      attachments: [
        {
          filename: "weekly-report.pdf",
          content: pdfBuffer
        }
      ]
    });

    res.json({ message: "Email sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email sending failed" });
  }
});

/* ================= UPDATE POST DESCRIPTION ================= */
app.put('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userid, description } = req.body;

    if (!userid || !description) {
      return res.status(400).json({
        message: "Missing user ID or description"
      });
    }

    // Update only if post belongs to user
    const result = await pool.query(
      `UPDATE posts
       SET description = $1
       WHERE post_id = $2 AND userid = $3
       RETURNING *`,
      [description, postId, userid]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        message: "Not authorized or post not found"
      });
    }

    res.json({
      message: "Post updated successfully",
      post: result.rows[0]
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.put("/api/users/:id/disabled", async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;

    await pool.query(
      `UPDATE "User"
       SET disabled = $1,
           manual_override = TRUE
       WHERE userid = $2`,
      [disabled, id]
    );

    res.json({ message: "User status updated by admin" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// Start server
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📊 Test endpoint: http://localhost:${port}/api/test`);
  });
