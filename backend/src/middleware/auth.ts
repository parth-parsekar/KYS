import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { notifyAdmins } from '../services/adminAlert.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'kys_super_secret_jwt_key_2026';

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authorization token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or session expired' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    const attemptedEmail = req.user?.email || 'unauthenticated';
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    notifyAdmins({
      type: 'security_access',
      title: 'Security Alert: Unauthorized Admin Access Attempt',
      message: `Unauthorized attempt to access admin route (${req.originalUrl || req.url}) by ${attemptedEmail} from IP ${clientIp}.`,
      metadata: {
        attemptedEmail,
        route: req.originalUrl || req.url,
        ip: clientIp,
        userId: req.user?._id,
      },
    }).catch((e) => console.warn(e));

    res.status(403).json({ success: false, message: 'Admin access required. Your account does not have administrator privileges.' });
    return;
  }
  next();
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

