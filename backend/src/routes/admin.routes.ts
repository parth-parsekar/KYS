import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { BillingHistory } from '../models/BillingHistory.js';
import { Notification } from '../models/Notification.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/dashboard - 100% Live aggregate platform metrics with interactive timeframe & drilldowns
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { timeframe = '30d' } = req.query;

    const totalUsers = await User.countDocuments();
    const pendingWaitlistCount = await User.countDocuments({ approvalStatus: 'pending' });
    const activeSubscriptions = await Subscription.countDocuments({ status: 'Active' });

    let daysBack = 30;
    if (timeframe === '90d') daysBack = 90;
    else if (timeframe === '6m') daysBack = 180;
    else if (timeframe === '12m') daysBack = 365;
    else if (timeframe === 'all') daysBack = 3650;

    const periodStartDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const newUsersInPeriod = await User.countDocuments({ createdAt: { $gte: periodStartDate } });

    const subsPerUser =
      totalUsers > 0 ? parseFloat((activeSubscriptions / totalUsers).toFixed(1)) : 0;

    // Determine number of trend months based on timeframe
    const numTrendMonths = timeframe === '12m' ? 12 : 6;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = [];
    const monthlyDrilldown: Record<string, any> = {};
    const now = new Date();

    for (let i = numTrendMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const monthLabel = `${mName} ${year}`;
      const startOfMonth = new Date(year, d.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);

      const isCurrentMonth = i === 0;
      const activeCount = isCurrentMonth
        ? activeSubscriptions
        : await Subscription.countDocuments({
            startDate: { $lte: endOfMonth },
            status: { $in: ['Active', 'Paused'] },
          });

      // Total billing transactions in that month
      const billingsInMonth = await BillingHistory.find({
        billingDate: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const totalBilled = billingsInMonth
        .filter((b) => b.billingStatus === 'Paid')
        .reduce((acc, curr) => acc + curr.billingAmount, 0);

      const totalPending = billingsInMonth
        .filter((b) => b.billingStatus === 'Pending')
        .reduce((acc, curr) => acc + curr.billingAmount, 0);

      trend.push({
        month: mName,
        year,
        label: monthLabel,
        count: activeCount,
        volume: Math.round(totalBilled * 100) / 100,
        pendingVolume: Math.round(totalPending * 100) / 100,
      });

      monthlyDrilldown[mName] = {
        month: mName,
        year,
        activeSubscriptions: activeCount,
        paidVolume: Math.round(totalBilled * 100) / 100,
        pendingVolume: Math.round(totalPending * 100) / 100,
        totalEvents: billingsInMonth.length,
        paidEvents: billingsInMonth.filter((b) => b.billingStatus === 'Paid').length,
        pendingEvents: billingsInMonth.filter((b) => b.billingStatus === 'Pending').length,
      };
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
        timeframe,
        totalUsers,
        pendingWaitlistCount,
        activeSubscriptions,
        newUsers: newUsersInPeriod,
        subsPerUser,
        trend,
        monthlyDrilldown,
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
    const pendingWaitlistCount = await User.countDocuments({ approvalStatus: 'pending' });
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

// GET /api/admin/waitlist - List users awaiting approval
router.get('/waitlist', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pendingUsers = await User.find({ approvalStatus: 'pending' })
      .select('name email role approvalStatus createdAt updatedAt')
      .sort({ createdAt: -1 });

    const recentUsers = await User.find()
      .select('name email role approvalStatus createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      count: pendingUsers.length,
      waitlist: pendingUsers,
      recentUsers,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching waitlist' });
  }
});

// PATCH /api/admin/users/:id/approve - Approve user registration
router.patch('/users/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.approvalStatus = 'approved';
    await user.save();

    // Create a welcoming system notification for the approved user
    try {
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Account Approved! 🎉',
        message: 'Your registration request has been approved by the administrator. Welcome to KYS!',
      });
    } catch (e) {
      console.warn('Could not create approval notification:', e);
    }

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been approved.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error approving user' });
  }
});

// PATCH /api/admin/users/:id/reject - Reject user registration
router.patch('/users/:id/reject', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot reject an administrator account.' });
      return;
    }

    user.approvalStatus = 'rejected';
    await user.save();

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been rejected.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error rejecting user' });
  }
});

export default router;
