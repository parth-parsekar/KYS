import cron from 'node-cron';
import { Subscription } from '../models/Subscription.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendNotificationToUser } from './socket.js';

export async function checkRenewalsAndBudgets(): Promise<{ renewalAlerts: number; budgetAlerts: number }> {
  let renewalAlertsCreated = 0;
  let budgetAlertsCreated = 0;

  try {
    const now = new Date();
    // 3 days from now
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    // start of today (local or UTC)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Check Renewal Notifications for Active Subscriptions
    // Due within 3 days: nextRenewalDate >= startOfToday and nextRenewalDate <= threeDaysFromNow
    const dueSubscriptions = await Subscription.find({
      status: 'Active',
      nextRenewalDate: { $gte: startOfToday, $lte: threeDaysFromNow },
    }).populate('user');

    for (const sub of dueSubscriptions) {
      const cycleDateStr = sub.nextRenewalDate.toISOString().split('T')[0];
      const cycleIdentifier = `renewal_${sub._id}_${cycleDateStr}`;

      // Check if notification already exists for this renewal cycle
      const existing = await Notification.findOne({
        user: sub.user._id,
        renewalCycleIdentifier: cycleIdentifier,
      });

      if (!existing) {
        // Calculate days remaining
        const diffMs = sub.nextRenewalDate.getTime() - now.getTime();
        const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const daysText = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;

        const notification = new Notification({
          user: sub.user._id,
          subscription: sub._id,
          type: 'renewal_upcoming',
          title: `${sub.serviceName} renews ${daysText}`,
          message: `$${sub.amount.toFixed(2)} ${sub.currency} · Renews ${cycleDateStr}`,
          renewalCycleIdentifier: cycleIdentifier,
          metadata: {
            serviceName: sub.serviceName,
            amount: sub.amount,
            currency: sub.currency,
            nextRenewalDate: sub.nextRenewalDate,
          },
        });

        await notification.save();
        renewalAlertsCreated++;

        sendNotificationToUser(sub.user._id.toString(), {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          isRead: false,
          subscription: sub._id,
        });
      }
    }

    // 2. Check Budget Utilization for Users
    const users = await User.find({ notifyOnThreshold: true });
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    for (const user of users) {
      if (!user.monthlyBudget || user.monthlyBudget <= 0) continue;

      // Find all active subscriptions for this user in their preferred currency (or default USD)
      const userSubs = await Subscription.find({
        user: user._id,
        status: 'Active',
        currency: user.preferredCurrency || 'USD',
      });

      let totalMonthly = 0;
      for (const s of userSubs) {
        totalMonthly += s.getMonthlyEquivalent();
      }

      const utilization = (totalMonthly / user.monthlyBudget) * 100;
      const threshold = user.alertThreshold || 80;

      if (utilization >= threshold) {
        const budgetCycleIdentifier = `budget_${user._id}_${currentYear}_${currentMonth}_${Math.floor(threshold)}`;
        const existingBudgetNotif = await Notification.findOne({
          user: user._id,
          renewalCycleIdentifier: budgetCycleIdentifier,
        });

        if (!existingBudgetNotif) {
          const budgetNotification = new Notification({
            user: user._id,
            type: 'budget_threshold',
            title: 'Monthly budget threshold reached',
            message: `$${totalMonthly.toFixed(2)} of $${user.monthlyBudget.toFixed(2)} · ${Math.round(utilization)}% used · Threshold: ${threshold}%`,
            renewalCycleIdentifier: budgetCycleIdentifier,
            metadata: {
              utilization: Math.round(utilization),
              monthlyBudget: user.monthlyBudget,
              currentSpend: totalMonthly,
              threshold,
            },
          });

          await budgetNotification.save();
          budgetAlertsCreated++;

          sendNotificationToUser(user._id.toString(), {
            _id: budgetNotification._id,
            title: budgetNotification.title,
            message: budgetNotification.message,
            type: budgetNotification.type,
            createdAt: budgetNotification.createdAt,
            isRead: false,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error during scheduled renewal and budget check:', err);
  }

  return { renewalAlerts: renewalAlertsCreated, budgetAlerts: budgetAlertsCreated };
}

export function startScheduler(): void {
  // Run once every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled renewal & budget check...');
    await checkRenewalsAndBudgets();
  });
  console.log('Background renewal scheduler initialized.');
}

