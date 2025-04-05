const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
});

app.use('/api/auth', require('./routes/auth')(pool, bcrypt, jwt, upload));
app.use('/api/events', require('./routes/events')(pool, upload, jwt));

app.listen(3000, () => console.log('Server running on port 3000'));