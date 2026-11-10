import { Router, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { checkRenewalsAndBudgets } from '../services/scheduler.js';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.query; // 'unread', 'read', 'all'

    const filter: any = { user: userId };
    if (status === 'unread') {
      filter.isRead = false;
    } else if (status === 'read') {
      filter.isRead = true;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    // Separate today vs earlier
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayList = [];
    const earlierList = [];

    for (const notif of notifications) {
      if (new Date(notif.createdAt) >= startOfToday) {
        todayList.push(notif);
      } else {
        earlierList.push(notif);
      }
    }

    res.json({
      success: true,
      unreadCount,
      totalCount: notifications.length,
      today: todayList,
      earlier: earlierList,
      all: notifications,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    const unreadCount = await Notification.countDocuments({ user: req.user!._id, isRead: false });
    res.json({ success: true, notification: notif, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ user: req.user!._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/check-now - On-demand trigger for renewal checks
router.post('/check-now', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await checkRenewalsAndBudgets();
    res.json({ success: true, message: 'Renewal check completed', result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
