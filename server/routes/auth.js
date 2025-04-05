const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

module.exports = (pool, bcrypt, jwt, upload) => {
  router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ token });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Username or email already exists' });
      else res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

  router.get('/profile', verifyToken, async (req, res) => {
    const [users] = await pool.query('SELECT username, profile_pic FROM users WHERE id = ?', [req.user.id]);
    res.json(users[0]);
  });

  router.put('/profile', verifyToken, upload.single('profilePic'), async (req, res) => {
    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;
    await pool.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profilePic, req.user.id]);
    res.status(200).send();
  });

  return router;
};