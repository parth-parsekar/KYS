import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { BillingHistory } from '../models/BillingHistory.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { checkRenewalsAndBudgets } from '../services/scheduler.js';
import { convertCurrency } from '../services/currency.js';

const router = Router();
router.use(authenticate);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/subscriptions - List user's subscriptions with filters & active totals
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { category, frequency, status, search, sort } = req.query;

    const query: any = { user: userId };

    if (category && category !== 'All' && category !== 'All categories') {
      query.category = category;
    }

    if (frequency && frequency !== 'All' && frequency !== 'All billing frequencies') {
      query.billingFrequency = frequency;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.serviceName = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    let sortOption: any = { nextRenewalDate: 1 };
    if (sort === 'amount_asc') sortOption = { amount: 1 };
    else if (sort === 'amount_desc') sortOption = { amount: -1 };
    else if (sort === 'name') sortOption = { serviceName: 1 };
    else if (sort === 'Next renewal' || sort === 'renewal_asc') sortOption = { nextRenewalDate: 1 };

    const subscriptions = await Subscription.find(query).sort(sortOption);

    // Compute contextual status counts matching the active search, category, and frequency filters
    // This ensures status button counts (All, Active, Paused, etc.) reflect the actual filtered dataset
    const contextFilter: any = { user: userId };
    if (category && category !== 'All' && category !== 'All categories') {
      contextFilter.category = category;
    }
    if (frequency && frequency !== 'All' && frequency !== 'All billing frequencies') {
      contextFilter.billingFrequency = frequency;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      contextFilter.serviceName = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const contextSubs = await Subscription.find(contextFilter);
    const counts = {
      all: contextSubs.length,
      active: contextSubs.filter((s) => s.status === 'Active').length,
      paused: contextSubs.filter((s) => s.status === 'Paused').length,
      cancelled: contextSubs.filter((s) => s.status === 'Cancelled').length,
      expired: contextSubs.filter((s) => s.status === 'Expired').length,
    };

    // Calculate active total monthly and annual projection for the matching context
    const targetCurrency = req.user!.preferredCurrency || 'USD';
    let activeMonthlyTotal = 0;
    const activeSubs = contextSubs.filter((s) => s.status === 'Active');
    for (const sub of activeSubs) {
      activeMonthlyTotal += convertCurrency(sub.getMonthlyEquivalent(), sub.currency, targetCurrency);
    }
    const activeAnnualTotal = activeMonthlyTotal * 12;

    // Global totals across entire account
    const allUserSubs = await Subscription.find({ user: userId });
    let globalActiveMonthly = 0;
    for (const sub of allUserSubs.filter((s) => s.status === 'Active')) {
      globalActiveMonthly += convertCurrency(sub.getMonthlyEquivalent(), sub.currency, targetCurrency);
    }

    res.json({
      success: true,
      data: subscriptions,
      meta: {
        counts,
        totalAccountSubscriptions: allUserSubs.length,
        hasActiveFilters: Boolean(
          (category && category !== 'All' && category !== 'All categories') ||
            (frequency && frequency !== 'All' && frequency !== 'All billing frequencies') ||
            (status && status !== 'All') ||
            (search && typeof search === 'string' && search.trim() !== '')
        ),
        activeMonthlyTotal: Math.round(activeMonthlyTotal * 100) / 100,
        activeAnnualTotal: Math.round(activeAnnualTotal * 100) / 100,
        globalActiveMonthlyTotal: Math.round(globalActiveMonthly * 100) / 100,
        currency: targetCurrency,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching subscriptions' });
  }
});

// GET /api/subscriptions/export/csv - Export user subscriptions as CSV (PRD Section 3.4)
router.get('/export/csv', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const subscriptions = await Subscription.find({ user: userId }).sort({ serviceName: 1 });

    const headers = [
      'Service Name',
      'Category',
      'Amount',
      'Currency',
      'Billing Frequency',
      'Monthly Equivalent',
      'Status',
      'Start Date',
      'Next Renewal Date',
      'Custom Entry',
      'Notes',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = subscriptions.map((s) => [
      escapeCsv(s.serviceName),
      escapeCsv(s.category),
      escapeCsv(s.amount.toFixed(2)),
      escapeCsv(s.currency),
      escapeCsv(s.billingFrequency),
      escapeCsv(s.getMonthlyEquivalent().toFixed(2)),
      escapeCsv(s.status),
      escapeCsv(new Date(s.startDate).toISOString().split('T')[0]),
      escapeCsv(new Date(s.nextRenewalDate).toISOString().split('T')[0]),
      escapeCsv(s.customService ? 'Yes' : 'No'),
      escapeCsv(s.notes || ''),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="kys-subscriptions.csv"');
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error exporting subscriptions' });
  }
});

// GET /api/subscriptions/:id - Get single subscription with billing history
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid subscription ID format' });
      return;
    }

    const sub = await Subscription.findOne({ _id: id, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
      return;
    }

    const billingEvents = await BillingHistory.find({ subscription: sub._id, user: req.user!._id }).sort({ billingDate: -1 });

    res.json({
      success: true,
      subscription: sub,
      monthlyEquivalent: sub.getMonthlyEquivalent(),
      billingEvents,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching subscription' });
  }
});

// POST /api/subscriptions - Create new subscription
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      serviceName,
      category,
      amount,
      currency,
      billingFrequency,
      startDate,
      nextRenewalDate,
      status,
      customService,
      notes,
    } = req.body;

    if (!serviceName || !serviceName.trim()) {
      res.status(400).json({ success: false, message: 'Service name is required' });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
      return;
    }

    if (!startDate || !nextRenewalDate) {
      res.status(400).json({ success: false, message: 'Start date and next renewal date are required.' });
      return;
    }

    const start = new Date(startDate);
    const renewal = new Date(nextRenewalDate);

    if (renewal < start) {
      res.status(400).json({ success: false, message: 'Next renewal date cannot be before start date.' });
      return;
    }

    const newSub = await Subscription.create({
      user: req.user!._id,
      serviceName: serviceName.trim(),
      category: category || 'Productivity',
      amount: numericAmount,
      currency: currency || req.user!.preferredCurrency || 'USD',
      billingFrequency: billingFrequency || 'Monthly',
      startDate: start,
      nextRenewalDate: renewal,
      status: status || 'Active',
      customService: Boolean(customService),
      notes: notes || '',
    });

    // Record initial billing event for the newly created subscription
    try {
      await BillingHistory.create({
        user: req.user!._id,
        subscription: newSub._id,
        billingDate: start,
        billingAmount: numericAmount,
        currency: newSub.currency,
        eventType: 'First Payment',
        billingStatus: 'Paid',
        dataSource: 'Manual entry',
        notes: `Initial subscription setup for ${newSub.serviceName}`,
      });
    } catch (e) {
      console.warn('Could not record initial billing history event', e);
    }

    // Check renewals & budget in background
    checkRenewalsAndBudgets().catch((e) => console.error(e));

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: newSub,
      monthlyEquivalent: newSub.getMonthlyEquivalent(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error creating subscription' });
  }
});

// PUT /api/subscriptions/:id - Update subscription
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findOne({ _id: id, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
      return;
    }

    const {
      serviceName,
      category,
      amount,
      currency,
      billingFrequency,
      startDate,
      nextRenewalDate,
      status,
      notes,
    } = req.body;

    if (serviceName) sub.serviceName = serviceName.trim();
    if (category) sub.category = category;
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
        return;
      }
      sub.amount = num;
    }
    if (currency) sub.currency = currency.toUpperCase().trim();
    if (billingFrequency) sub.billingFrequency = billingFrequency;
    if (startDate) sub.startDate = new Date(startDate);
    if (nextRenewalDate) sub.nextRenewalDate = new Date(nextRenewalDate);
    if (status) sub.status = status;
    if (notes !== undefined) sub.notes = notes;

    if (sub.nextRenewalDate < sub.startDate) {
      res.status(400).json({ success: false, message: 'Next renewal date cannot be before start date.' });
      return;
    }

    await sub.save();

    // Re-check alerts
    checkRenewalsAndBudgets().catch((e) => console.error(e));

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: sub,
      monthlyEquivalent: sub.getMonthlyEquivalent(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating subscription' });
  }
});

// PATCH /api/subscriptions/:id/pause
router.patch('/:id/pause', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    sub.status = 'Paused';
    await sub.save();
    res.json({ success: true, message: 'Subscription paused. Excluded from spending totals and renewal alerts.', subscription: sub });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/subscriptions/:id/resume
router.patch('/:id/resume', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    sub.status = 'Active';
    if (req.body.nextRenewalDate) {
      sub.nextRenewalDate = new Date(req.body.nextRenewalDate);
    }
    await sub.save();
    checkRenewalsAndBudgets().catch((e) => console.error(e));
    res.json({ success: true, message: 'Subscription resumed as Active.', subscription: sub });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/subscriptions/:id/cancel
router.patch('/:id/cancel', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    sub.status = 'Cancelled';
    await sub.save();
    res.json({ success: true, message: 'Subscription marked as Cancelled. Excluded from totals.', subscription: sub });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    await BillingHistory.deleteMany({ subscription: sub._id });
    res.json({ success: true, message: 'Subscription permanently deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
