import { Router, Response } from 'express';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { sendNotificationToAllUsers, getSocketIO } from '../services/socket.js';

const router = Router();
router.use(authenticate);

// GET /api/events - List all events (accessible to all authenticated users)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email role')
      .sort({ eventDate: 1, createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching events' });
  }
});

// POST /api/events - Create new event (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, eventDate, category, priority } = req.body;

    if (!title || !description || !eventDate) {
      res.status(400).json({ success: false, message: 'Title, description, and event date are required.' });
      return;
    }

    const newEvent = await Event.create({
      title,
      description,
      eventDate: new Date(eventDate),
      category: category || 'Platform Update',
      priority: priority || 'medium',
      createdBy: req.user!._id,
    });

    const populatedEvent = await Event.findById(newEvent._id).populate('createdBy', 'name email role');

    // Create notifications for all regular users in the database
    const allUsers = await User.find({ role: 'user' }).select('_id');
    if (allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        user: u._id,
        type: 'system',
        title: `📢 New Event: ${title}`,
        message: `${description} (${new Date(eventDate).toLocaleDateString()})`,
        isRead: false,
        metadata: { eventId: newEvent._id, action: 'created' },
      }));
      await Notification.insertMany(notifications);
    }

    // Broadcast real-time notification to all connected clients
    const payload = {
      id: newEvent._id.toString(),
      type: 'event:created',
      title: `📢 New Event: ${title}`,
      message: `${description} (${new Date(eventDate).toLocaleDateString()})`,
      createdAt: new Date().toISOString(),
      event: populatedEvent,
    };

    sendNotificationToAllUsers(payload);
    const io = getSocketIO();
    if (io) {
      io.emit('event:created', populatedEvent);
    }

    res.status(201).json({
      success: true,
      message: 'Event created and broadcast to users successfully.',
      data: populatedEvent,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error creating event' });
  }
});

// PUT /api/events/:id - Update an existing event (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, eventDate, category, priority } = req.body;

    const existing = await Event.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (title) existing.title = title;
    if (description) existing.description = description;
    if (eventDate) existing.eventDate = new Date(eventDate);
    if (category) existing.category = category;
    if (priority) existing.priority = priority;

    await existing.save();
    const updated = await Event.findById(existing._id).populate('createdBy', 'name email role');

    // Create update notification for all regular users
    const allUsers = await User.find({ role: 'user' }).select('_id');
    if (allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        user: u._id,
        type: 'system',
        title: `✏️ Event Updated: ${existing.title}`,
        message: `Details updated: ${existing.description} (${new Date(existing.eventDate).toLocaleDateString()})`,
        isRead: false,
        metadata: { eventId: existing._id, action: 'updated' },
      }));
      await Notification.insertMany(notifications);
    }

    // Broadcast real-time update notification
    const payload = {
      id: existing._id.toString(),
      type: 'event:updated',
      title: `✏️ Event Updated: ${existing.title}`,
      message: `Details updated: ${existing.description}`,
      createdAt: new Date().toISOString(),
      event: updated,
    };

    sendNotificationToAllUsers(payload);
    const io = getSocketIO();
    if (io) {
      io.emit('event:updated', updated);
    }

    res.json({
      success: true,
      message: 'Event updated and broadcast to users successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating event' });
  }
});

// DELETE /api/events/:id - Delete an event (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const eventTitle = event.title;
    const eventId = event._id.toString();
    await Event.findByIdAndDelete(req.params.id);

    // Create cancellation notification for all regular users
    const allUsers = await User.find({ role: 'user' }).select('_id');
    if (allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        user: u._id,
        type: 'system',
        title: `🗑️ Event Cancelled: ${eventTitle}`,
        message: `The event "${eventTitle}" scheduled has been cancelled by administrator.`,
        isRead: false,
        metadata: { eventId, action: 'deleted' },
      }));
      await Notification.insertMany(notifications);
    }

    // Broadcast real-time cancellation notification
    const payload = {
      id: eventId,
      type: 'event:deleted',
      title: `🗑️ Event Cancelled: ${eventTitle}`,
      message: `The event "${eventTitle}" has been cancelled by administrator.`,
      createdAt: new Date().toISOString(),
      eventId,
    };

    sendNotificationToAllUsers(payload);
    const io = getSocketIO();
    if (io) {
      io.emit('event:deleted', { eventId, title: eventTitle });
    }

    res.json({
      success: true,
      message: `Event "${eventTitle}" deleted and notification sent.`,
      eventId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error deleting event' });
  }
});

export default router;
