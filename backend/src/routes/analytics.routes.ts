import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { BillingHistory } from '../models/BillingHistory.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { convertCurrency } from '../services/currency.js';

const router = Router();
router.use(authenticate);

// GET /api/analytics - Comprehensive spending analytics & aggregations
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const userId = user._id as mongoose.Types.ObjectId;
    const preferredCurrency = user.preferredCurrency || 'USD';

    // 1. Fetch all active subscriptions for the user
    const activeSubs = await Subscription.find({
      user: userId,
      status: 'Active',
    });

    let totalMonthlySpending = 0;
    const categoryTotals: Record<string, { amount: number; count: number }> = {};

    for (const sub of activeSubs) {
      const origMonthly = sub.getMonthlyEquivalent();
      const monthlyAmt = convertCurrency(origMonthly, sub.currency, preferredCurrency);
      totalMonthlySpending += monthlyAmt;

      if (!categoryTotals[sub.category]) {
        categoryTotals[sub.category] = { amount: 0, count: 0 };
      }
      categoryTotals[sub.category].amount += monthlyAmt;
      categoryTotals[sub.category].count += 1;
    }

    const annualProjection = totalMonthlySpending * 12;

    // Format category distribution
    const categoryDistribution = Object.entries(categoryTotals).map(([catName, data]) => ({
      category: catName,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
      percentage: totalMonthlySpending > 0 ? Math.round((data.amount / totalMonthlySpending) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // 2. Upcoming renewals in next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingSubs = await Subscription.find({
      user: userId,
      status: 'Active',
      nextRenewalDate: { $gte: startOfToday, $lte: sevenDaysFromNow },
    }).sort({ nextRenewalDate: 1 });

    const upcomingExpenditure = upcomingSubs.reduce(
      (acc, curr) => acc + convertCurrency(curr.amount, curr.currency, preferredCurrency),
      0
    );

    // 3. Monthly budget utilization
    const monthlyBudget = user.monthlyBudget || 300;
    const alertThreshold = user.alertThreshold || 80;
    const budgetUsedPercentage = monthlyBudget > 0 ? Math.round((totalMonthlySpending / monthlyBudget) * 100) : 0;
    const budgetRemaining = Math.max(0, monthlyBudget - totalMonthlySpending);
    const thresholdCrossed = budgetUsedPercentage >= alertThreshold;

    // 4. 12-month historical spending trends & interactive month-by-month breakdown
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const billingEvents = await BillingHistory.find({
      user: userId,
      billingDate: { $gte: twelveMonthsAgo, $lte: now },
    });

    const allUserSubs = await Subscription.find({ user: userId });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const historicalTrends = [];
    const monthlyBreakdowns = [];

    // Synthesize / aggregate 12-month trend & interactive past month details
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const label = `${mName} ${year}`;
      const monthEnd = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);

      // Aggregate recorded events for this month
      const eventsInMonth = billingEvents.filter((e) => {
        const ed = new Date(e.billingDate);
        return ed.getFullYear() === year && ed.getMonth() === d.getMonth();
      });

      // Active subscriptions during that month
      const subsActiveInMonth = allUserSubs.filter((s) => new Date(s.startDate) <= monthEnd);

      const billedMap = new Map<string, any>();
      eventsInMonth.forEach((e) => {
        billedMap.set(e.subscription.toString(), e);
      });

      const monthItems: any[] = [];
      let paidTotal = 0;
      let pendingTotal = 0;

      for (const sub of subsActiveInMonth) {
        const event = billedMap.get(sub._id.toString());
        const convertedMonthly = convertCurrency(sub.getMonthlyEquivalent(), sub.currency, preferredCurrency);

        if (event) {
          const eventConverted = convertCurrency(event.billingAmount, event.currency, preferredCurrency);
          if (event.billingStatus === 'Paid') {
            paidTotal += eventConverted;
            monthItems.push({
              id: sub._id,
              serviceName: sub.serviceName,
              category: sub.category,
              amount: event.billingAmount,
              currency: event.currency,
              convertedAmount: eventConverted,
              billingFrequency: sub.billingFrequency,
              billingDate: event.billingDate,
              status: 'Paid',
              eventType: event.eventType,
            });
          } else {
            pendingTotal += eventConverted;
            monthItems.push({
              id: sub._id,
              serviceName: sub.serviceName,
              category: sub.category,
              amount: event.billingAmount,
              currency: event.currency,
              convertedAmount: eventConverted,
              billingFrequency: sub.billingFrequency,
              billingDate: event.billingDate,
              status: event.billingStatus || 'Pending',
              eventType: event.eventType,
            });
          }
        } else {
          // In past or current months, an active subscription without an explicit Paid record is treated as Pending
          const billingDay = Math.min(new Date(sub.startDate).getDate() || 1, 28);
          const estDate = new Date(year, d.getMonth(), billingDay);
          const isPending = estDate <= now;
          const status = isPending ? 'Pending' : 'Scheduled';

          if (isPending) {
            pendingTotal += convertedMonthly;
          } else {
            paidTotal += convertedMonthly;
          }

          monthItems.push({
            id: sub._id,
            serviceName: sub.serviceName,
            category: sub.category,
            amount: sub.amount,
            currency: sub.currency,
            convertedAmount: convertedMonthly,
            billingFrequency: sub.billingFrequency,
            billingDate: estDate,
            status,
            eventType: 'Renewal',
          });
        }
      }

      let trendAmount = 0;

      if (i === 0) {
        // Current active month (latest bar): dynamically matches the user's current live active monthly spending
        trendAmount = totalMonthlySpending;
        const currentItemsTotal = paidTotal + pendingTotal;
        if (currentItemsTotal < totalMonthlySpending) {
          pendingTotal += (totalMonthlySpending - currentItemsTotal);
        }
      } else {
        // Past months: strictly computed from recorded billing events or active subscriptions in that month
        if (eventsInMonth.length > 0) {
          trendAmount = eventsInMonth.reduce(
            (acc, curr) => acc + convertCurrency(curr.billingAmount, curr.currency, preferredCurrency),
            0
          );
        } else {
          trendAmount = subsActiveInMonth.reduce(
            (acc, curr) => acc + convertCurrency(curr.getMonthlyEquivalent(), curr.currency, preferredCurrency),
            0
          );
        }
      }

      historicalTrends.push({
        month: mName,
        year,
        label: `${mName} ${year.toString().slice(-2)}`,
        amount: Math.round(trendAmount * 100) / 100,
      });

      const totalSpentForMonth = i === 0 ? Math.max(totalMonthlySpending, paidTotal + pendingTotal) : (paidTotal + pendingTotal);

      monthlyBreakdowns.push({
        month: mName,
        year,
        label,
        totalPaid: Math.round(paidTotal * 100) / 100,
        totalPending: Math.round(pendingTotal * 100) / 100,
        totalSpent: Math.round(totalSpentForMonth * 100) / 100,
        paidCount: monthItems.filter((m) => m.status === 'Paid').length,
        pendingCount: monthItems.filter((m) => m.status === 'Pending').length,
        items: monthItems,
      });
    }

    res.json({
      success: true,
      data: {
        currency: preferredCurrency,
        monthlySpending: Math.round(totalMonthlySpending * 100) / 100,
        annualProjection: Math.round(annualProjection * 100) / 100,
        activeCount: activeSubs.length,
        categoriesCount: categoryDistribution.length,
        upcomingRenewals: {
          count: upcomingSubs.length,
          totalAmount: Math.round(upcomingExpenditure * 100) / 100,
          subscriptions: upcomingSubs.map((s) => ({
            id: s._id,
            serviceName: s.serviceName,
            category: s.category,
            amount: s.amount,
            currency: s.currency,
            nextRenewalDate: s.nextRenewalDate,
          })),
        },
        budget: {
          limit: monthlyBudget,
          current: Math.round(totalMonthlySpending * 100) / 100,
          usedPercentage: budgetUsedPercentage,
          remaining: Math.round(budgetRemaining * 100) / 100,
          alertThreshold,
          thresholdCrossed,
        },
        categoryDistribution,
        historicalTrends,
        monthlyBreakdowns,
        dataSourceNote: 'Real-time billing events & subscription telemetry',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error generating analytics' });
  }
});

export default router;

