import { Router, Response } from 'express';
import { BillingHistory } from '../models/BillingHistory.js';
import { Subscription } from '../models/Subscription.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/billing/:subscriptionId
router.get('/:subscriptionId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const sub = await Subscription.findOne({ _id: subscriptionId, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    const events = await BillingHistory.find({ subscription: sub._id, user: req.user!._id }).sort({ billingDate: -1 });
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/billing/:subscriptionId - Record a billing event
router.post('/:subscriptionId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const sub = await Subscription.findOne({ _id: subscriptionId, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    const { billingAmount, currency, billingDate, billingStatus, eventType, notes } = req.body;
    const num = parseFloat(billingAmount);
    if (isNaN(num) || num <= 0) {
      res.status(400).json({ success: false, message: 'Billing amount must be greater than zero.' });
      return;
    }

    const event = await BillingHistory.create({
      user: req.user!._id,
      subscription: sub._id,
      billingAmount: num,
      currency: currency || sub.currency,
      billingDate: billingDate ? new Date(billingDate) : new Date(),
      billingStatus: billingStatus || 'Paid',
      eventType: eventType || 'Renewal',
      dataSource: 'user-entered',
      notes: notes || '',
    });

    res.status(201).json({ success: true, message: 'Billing event recorded successfully', event });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
