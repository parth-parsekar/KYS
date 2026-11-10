import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/dashboard - 100% Live aggregate platform metrics
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'Active' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    const subsPerUser =
      totalUsers > 0 ? parseFloat((activeSubscriptions / totalUsers).toFixed(1)) : 0;

    // 6-month historical active subscriptions (June to November 2026)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await Subscription.countDocuments({
        startDate: { $lte: endOfMonth },
        status: { $in: ['Active', 'Paused'] },
      });
      trend.push({ month: mName, count });
    }

    // Category distribution grouped from live active subscriptions
    const categoryAgg = await Subscription.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categoryDistribution = categoryAgg.map((item) => ({
      category: item._id,
      activeCount: item.count,
      sharePercentage:
        activeSubscriptions > 0
          ? parseFloat(((item.count / activeSubscriptions) * 100).toFixed(1))
          : 0,
    }));

    // Platform summary
    const usersWithSubs = (await Subscription.distinct('user', { status: 'Active' })).length;
    const usersWithoutSubs = Math.max(0, totalUsers - usersWithSubs);

    const mostTrackedAgg = await Subscription.aggregate([
      { $group: { _id: '$serviceName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostTrackedService = mostTrackedAgg[0]?._id || 'Netflix';

    const platformSummary = {
      usersWithSubscriptions: usersWithSubs,
      usersWithoutSubscriptions: usersWithoutSubs,
      mostTrackedService,
      reportingCurrency: 'USD',
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        newUsers,
        subsPerUser,
        trend,
        categoryDistribution,
        platformSummary,
        adminUser: {
          id: req.user!._id,
          name: req.user!.name,
          email: req.user!.email,
          role: req.user!.role,
        },
        disclaimer: 'Admin-only · Live platform telemetry · Privacy compliant (no personal spending details).',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching admin metrics' });
  }
});

// GET /api/admin/export - Export real platform metrics summary as CSV
router.get('/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'Active' });
    const subsPerUser =
      totalUsers > 0 ? parseFloat((activeSubscriptions / totalUsers).toFixed(1)) : 0;

    const usersWithSubs = (await Subscription.distinct('user', { status: 'Active' })).length;
    const usersWithoutSubs = Math.max(0, totalUsers - usersWithSubs);

    const mostTrackedAgg = await Subscription.aggregate([
      { $group: { _id: '$serviceName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostTrackedService = mostTrackedAgg[0]?._id || 'Netflix';

    const categoryAgg = await Subscription.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categoryRows = categoryAgg.map((item) => {
      const share =
        activeSubscriptions > 0
          ? ((item.count / activeSubscriptions) * 100).toFixed(1)
          : '0.0';
      return `"${item._id}",${item.count},${share}%`;
    });

    const lines = [
      'KYS Platform Overview Report',
      `Export Date,${today}`,
      'Platform,KYS - Know Your Subscription Manager',
      `Administrator,"${req.user!.name} (${req.user!.email})"`,
      `Total Registered Users,${totalUsers}`,
      `Active Subscriptions,${activeSubscriptions}`,
      `Subscriptions Per User,${subsPerUser}`,
      `Users With Active Subscriptions,${usersWithSubs}`,
      `Users Without Subscriptions,${usersWithoutSubs}`,
      `Most Tracked Service,"${mostTrackedService}"`,
      'Reporting Currency,USD',
      '',
      'Category Distribution',
      'Category,Active Subscriptions,Share of Total',
      ...categoryRows,
    ];

    const csvContent = lines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="kys-platform-report.csv"');
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
