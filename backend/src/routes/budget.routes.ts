import { Router, Response } from 'express';
import { Subscription } from '../models/Subscription.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { checkRenewalsAndBudgets } from '../services/scheduler.js';
import { convertCurrency } from '../services/currency.js';

const router = Router();
router.use(authenticate);

// GET /api/budget
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const targetCurrency = user.preferredCurrency || 'USD';
    const activeSubs = await Subscription.find({
      user: user._id,
      status: 'Active',
    });

    let currentSpend = 0;
    for (const s of activeSubs) {
      currentSpend += convertCurrency(s.getMonthlyEquivalent(), s.currency, targetCurrency);
    }

    const limit = user.monthlyBudget || 300;
    const usedPercentage = limit > 0 ? Math.round((currentSpend / limit) * 100) : 0;
    const remaining = Math.max(0, limit - currentSpend);

    res.json({
      success: true,
      budget: {
        limit,
        currency: user.preferredCurrency || 'USD',
        alertThreshold: user.alertThreshold || 80,
        notifyOnThreshold: user.notifyOnThreshold ?? true,
        currentSpend: Math.round(currentSpend * 100) / 100,
        usedPercentage,
        remaining: Math.round(remaining * 100) / 100,
        thresholdCrossed: usedPercentage >= (user.alertThreshold || 80),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching budget' });
  }
});

// PUT /api/budget
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { monthlyLimit, alertThreshold, notifyOnThreshold, currency } = req.body;

    if (monthlyLimit !== undefined) {
      const num = parseFloat(monthlyLimit);
      if (isNaN(num) || num < 0) {
        res.status(400).json({ success: false, message: 'Monthly limit must be a positive number.' });
        return;
      }
      user.monthlyBudget = num;
    }

    if (alertThreshold !== undefined) {
      const th = parseInt(alertThreshold, 10);
      if (isNaN(th) || th < 1 || th > 100) {
        res.status(400).json({ success: false, message: 'Alert threshold must be between 1 and 100%.' });
        return;
      }
      user.alertThreshold = th;
    }

    if (notifyOnThreshold !== undefined) {
      user.notifyOnThreshold = Boolean(notifyOnThreshold);
    }

    if (currency) {
      user.preferredCurrency = currency.toUpperCase().trim();
    }

    await user.save();

    // Check budget alerts
    checkRenewalsAndBudgets().catch((e) => console.error(e));

    res.json({
      success: true,
      message: 'Monthly budget updated successfully',
      budget: {
        limit: user.monthlyBudget,
        currency: user.preferredCurrency,
        alertThreshold: user.alertThreshold,
        notifyOnThreshold: user.notifyOnThreshold,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating budget' });
  }
});

export default router;

