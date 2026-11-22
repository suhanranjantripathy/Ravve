import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Get notifications for user
router.get('/', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  const notifications = db.prepare(`
    SELECT n.*, p.username as actor_username, p.full_name as actor_name, p.avatar_url as actor_avatar
    FROM notifications n
    LEFT JOIN profiles p ON n.actor_id = p.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 30
  `).all(currentUserId);

  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(currentUserId).count;

  res.json({
    notifications: notifications.map(n => ({ ...n, is_read: Boolean(n.is_read) })),
    unreadCount
  });
});

// Mark single notification as read
router.put('/:id/read', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const { id } = req.params;
  const db = getDb();

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, currentUserId);
  res.json({ message: 'Notification marked as read' });
});

// Mark all notifications as read
router.put('/mark-all-read', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(currentUserId);
  res.json({ message: 'All notifications marked as read' });
});

export default router;
