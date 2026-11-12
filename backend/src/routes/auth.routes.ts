import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.js';
import { notifyAdmins } from '../services/adminAlert.js';

const router = Router();

const isTest = process.env.NODE_ENV === 'test';
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

// POST /api/auth/register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, password, preferredCurrency, timezone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
      approvalStatus: 'pending',
      preferredCurrency: preferredCurrency || 'USD',
      timezone: timezone || 'America/Los_Angeles',
      monthlyBudget: 300,
      alertThreshold: 80,
      notifyOnThreshold: true,
    });

    // Alert administrators in real-time about new registration on the waitlist
    notifyAdmins({
      type: 'new_user_registration',
      title: 'New User Registration (Waitlist)',
      message: `${user.name} (${user.email}) has registered and is awaiting administrator approval.`,
      metadata: { userId: user._id, name: user.name, email: user.email },
    }).catch((e) => console.warn(e));

    res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Registration successful! Your account is on the waitlist awaiting administrator approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        preferredCurrency: user.preferredCurrency,
        timezone: user.timezone,
        monthlyBudget: user.monthlyBudget,
        alertThreshold: user.alertThreshold,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error registering account' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      notifyAdmins({
        type: 'security_access',
        title: 'Security Alert: Failed Login (Non-existent Account)',
        message: `Failed sign-in attempt for non-existent email "${email.toLowerCase().trim()}" from IP ${clientIp}.`,
        metadata: { attemptedEmail: email, ip: clientIp },
      }).catch((e) => console.warn(e));

      res.status(401).json({ success: false, message: 'The email or password is incorrect. Check your details and try again.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      notifyAdmins({
        type: 'security_access',
        title: `Security Alert: Failed Login (${user.role === 'admin' ? 'ADMIN Account' : 'User Account'})`,
        message: `Failed password attempt for ${user.email} (${user.name}) from IP ${clientIp}.`,
        metadata: { attemptedEmail: user.email, userId: user._id, role: user.role, ip: clientIp },
      }).catch((e) => console.warn(e));

      res.status(401).json({ success: false, message: 'The email or password is incorrect. Check your details and try again.' });
      return;
    }

    // Waitlist approval gatekeeper
    const status = user.approvalStatus || 'approved';
    if (user.role !== 'admin') {
      if (status === 'pending') {
        res.status(403).json({
          success: false,
          code: 'PENDING_APPROVAL',
          message: 'Your account is currently on the waitlist awaiting administrator approval. You will receive access once approved.',
        });
        return;
      }
      if (status === 'rejected') {
        res.status(403).json({
          success: false,
          code: 'REJECTED',
          message: 'Your registration request has been declined by the platform administrator.',
        });
        return;
      }
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredCurrency: user.preferredCurrency,
        timezone: user.timezone,
        monthlyBudget: user.monthlyBudget,
        alertThreshold: user.alertThreshold,
        notifyOnThreshold: user.notifyOnThreshold,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error signing in' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus || 'approved',
      preferredCurrency: user.preferredCurrency,
      timezone: user.timezone,
      monthlyBudget: user.monthlyBudget,
      alertThreshold: user.alertThreshold,
      notifyOnThreshold: user.notifyOnThreshold,
    },
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { name, preferredCurrency, timezone, monthlyBudget, alertThreshold, notifyOnThreshold } = req.body;

    if (name) user.name = name.trim();
    if (preferredCurrency) user.preferredCurrency = preferredCurrency.toUpperCase().trim();
    if (timezone) user.timezone = timezone.trim();
    if (typeof monthlyBudget === 'number' && monthlyBudget >= 0) user.monthlyBudget = monthlyBudget;
    if (typeof alertThreshold === 'number' && alertThreshold >= 1 && alertThreshold <= 100) {
      user.alertThreshold = alertThreshold;
    }
    if (typeof notifyOnThreshold === 'boolean') user.notifyOnThreshold = notifyOnThreshold;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredCurrency: user.preferredCurrency,
        timezone: user.timezone,
        monthlyBudget: user.monthlyBudget,
        alertThreshold: user.alertThreshold,
        notifyOnThreshold: user.notifyOnThreshold,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating profile' });
  }
});

export default router;

