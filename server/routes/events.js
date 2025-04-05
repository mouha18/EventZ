const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

module.exports = (pool, upload, jwt) => {
  router.get('/', async (req, res) => {
    const { category } = req.query;
    const query = category
      ? 'SELECT * FROM events WHERE category = ? AND date_time > NOW()'
      : 'SELECT * FROM events WHERE date_time > NOW()';
    const [events] = await pool.query(query, [category]);
    res.json(events);
  });

  router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    const { title, description, date_time, location, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const [result] = await pool.query(
        'INSERT INTO events (creator_id, title, description, date_time, location, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, title, description, date_time, location, category, image]
      );
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Event title already exists' });
      else res.status(500).json({ error: 'Server error' });
    }
  });

  router.get('/:id', verifyToken, async (req, res) => {
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    const event = events[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const [rsvps] = await pool.query('SELECT * FROM rsvps WHERE user_id = ? AND event_id = ?', [req.user.id, event.id]);
    const [bookmarks] = await pool.query('SELECT * FROM bookmarks WHERE user_id = ? AND event_id = ?', [req.user.id, event.id]);
    event.rsvpd = rsvps.length > 0;
    event.bookmarked = bookmarks.length > 0;
    res.json(event);
  });

  router.post('/:id/rsvp', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    const [rsvps] = await pool.query('SELECT * FROM rsvps WHERE user_id = ? AND event_id = ?', [req.user.id, eventId]);
    if (rsvps.length > 0) {
      await pool.query('DELETE FROM rsvps WHERE user_id = ? AND event_id = ?', [req.user.id, eventId]);
    } else {
      await pool.query('INSERT INTO rsvps (user_id, event_id) VALUES (?, ?)', [req.user.id, eventId]);
    }
    res.status(200).send();
  });

  router.post('/:id/bookmark', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    const [bookmarks] = await pool.query('SELECT * FROM bookmarks WHERE user_id = ? AND event_id = ?', [req.user.id, eventId]);
    if (bookmarks.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?', [req.user.id, eventId]);
    } else {
      await pool.query('INSERT INTO bookmarks (user_id, event_id) VALUES (?, ?)', [req.user.id, eventId]);
    }
    res.status(200).send();
  });

  router.post('/:id/comments', verifyToken, async (req, res) => {
    const { content } = req.body;
    if (content.length > 500) return res.status(400).json({ error: 'Comment too long' });
    await pool.query('INSERT INTO comments (user_id, event_id, content) VALUES (?, ?, ?)', [req.user.id, req.params.id, content]);
    res.status(201).send();
  });

  router.get('/:id/comments', verifyToken, async (req, res) => {
    const [comments] = await pool.query(`
      SELECT c.*, u.username, u.profile_pic, e.creator_id = ? AS isCreator, c.user_id = ? AS isCommenter
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN events e ON c.event_id = e.id
      WHERE c.event_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id, req.user.id, req.params.id]);
    res.json(comments);
  });

  router.delete('/comments/:commentId', verifyToken, async (req, res) => {
    const [comment] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
    const [event] = await pool.query('SELECT creator_id FROM events WHERE id = ?', [comment[0].event_id]);
    if (comment[0].user_id === req.user.id || event[0].creator_id === req.user.id) {
      await pool.query('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
      res.status(204).send();
    } else {
      res.status(403).json({ error: 'Unauthorized' });
    }
  });

  router.get('/my-events', verifyToken, async (req, res) => {
    const [created] = await pool.query('SELECT * FROM events WHERE creator_id = ?', [req.user.id]);
    const [rsvpd] = await pool.query(`
      SELECT e.* FROM events e
      JOIN rsvps r ON e.id = r.event_id
      WHERE r.user_id = ?
    `, [req.user.id]);
    res.json({ created, rsvpd });
  });

  router.get('/bookmarks', verifyToken, async (req, res) => {
    const [bookmarks] = await pool.query(`
      SELECT e.* FROM events e
      JOIN bookmarks b ON e.id = b.event_id
      WHERE b.user_id = ?
    `, [req.user.id]);
    res.json(bookmarks);
  });

  router.get('/search', async (req, res) => {
    const { q } = req.query;
    const [events] = await pool.query(
      'SELECT * FROM events WHERE title LIKE ? OR location LIKE ? OR description LIKE ? AND date_time > NOW()',
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.json(events);
  });

  return router;
};