import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { getSocketIO } from './socket.js';

interface AdminAlertParams {
  type: 'security_access' | 'unpaid_subscription' | 'new_user_registration';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  dedupIdentifier?: string;
}

/**
 * Creates persistent alerts for all admins and broadcasts in real-time via Socket.IO
 */
export async function notifyAdmins(params: AdminAlertParams): Promise<void> {
  try {
    const admins = await User.find({ role: 'admin' });
    if (!admins.length) return;

    for (const admin of admins) {
      if (params.dedupIdentifier) {
        const existing = await Notification.findOne({
          user: admin._id,
          renewalCycleIdentifier: params.dedupIdentifier,
        });
        if (existing) continue;
      }

      const notif = await Notification.create({
        user: admin._id,
        type: 'system',
        title: params.title,
        message: params.message,
        renewalCycleIdentifier: params.dedupIdentifier,
        metadata: {
          ...params.metadata,
          alertCategory: params.type,
          adminAlert: true,
        },
      });

      const io = getSocketIO();
      if (io) {
        io.to(`user:${admin._id}`).emit('notification:new', {
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          createdAt: notif.createdAt,
          isRead: false,
          metadata: notif.metadata,
        });
      }
    }
  } catch (err) {
    console.warn('Failed to notify admins:', err);
  }
}

