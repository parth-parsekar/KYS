import bcrypt from 'bcryptjs';
import { ServiceCatalog } from '../models/ServiceCatalog.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { BillingHistory } from '../models/BillingHistory.js';
import { Notification } from '../models/Notification.js';

export async function seedInitialData(): Promise<void> {
  const catalogCount = await ServiceCatalog.countDocuments();
  if (catalogCount === 0) {
    console.log('Seeding predefined service catalog...');
    const catalogServices = [
      { name: 'Netflix', category: 'Entertainment', suggestedPrice: 23.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/netflix/E50914' },
      { name: 'Spotify', category: 'Entertainment', suggestedPrice: 12.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/spotify/1DB954' },
      { name: 'Figma', category: 'Productivity', suggestedPrice: 180.0, currency: 'USD', billingFrequency: 'Yearly', logoUrl: 'https://cdn.simpleicons.org/figma/F24E1E' },
      { name: 'Dropbox', category: 'Storage', suggestedPrice: 144.0, currency: 'USD', billingFrequency: 'Yearly', logoUrl: 'https://cdn.simpleicons.org/dropbox/0061FF' },
      { name: 'Notion', category: 'Productivity', suggestedPrice: 30.0, currency: 'USD', billingFrequency: 'Quarterly', logoUrl: 'https://cdn.simpleicons.org/notion/000000' },
      { name: 'Adobe', category: 'Work tools', suggestedPrice: 120.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/adobe/FF0000' },
      { name: 'Slack', category: 'Productivity', suggestedPrice: 9.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/slack/4A154B' },
      { name: 'Zoom', category: 'Work tools', suggestedPrice: 16.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/zoom/2D8CFF' },
      { name: 'GitHub', category: 'Work tools', suggestedPrice: 4.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/github/181717' },
      { name: 'GitHub Copilot', category: 'Work tools', suggestedPrice: 10.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/githubcopilot/000000' },
      { name: 'iCloud', category: 'Storage', suggestedPrice: 3.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/icloud/3699FF' },
      { name: 'YouTube', category: 'Entertainment', suggestedPrice: 14.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/youtube/FF0000' },
      { name: 'Linear', category: 'Productivity', suggestedPrice: 10.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/linear/5E6AD2' },
      { name: 'Trello', category: 'Productivity', suggestedPrice: 2.0, currency: 'USD', billingFrequency: 'Weekly', logoUrl: 'https://cdn.simpleicons.org/trello/0052CC' },
      { name: 'Canva', category: 'Productivity', suggestedPrice: 15.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/canva/00C4CC' },
      { name: 'AWS', category: 'Work tools', suggestedPrice: 20.0, currency: 'USD', billingFrequency: 'Monthly', logoUrl: 'https://cdn.simpleicons.org/amazonwebservices/232F3E' },
    ];
    await ServiceCatalog.insertMany(catalogServices);
    console.log(`Seeded ${catalogServices.length} catalog items.`);
  }

  // Seed demo User Alex Morgan if not exists
  let alex = await User.findOne({ email: 'alex@example.com' });
  if (!alex) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    alex = await User.create({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      passwordHash: hash,
      role: 'user',
      preferredCurrency: 'USD',
      timezone: 'America/Los_Angeles',
      monthlyBudget: 300,
      alertThreshold: 80,
      notifyOnThreshold: true,
    });
    console.log('Seeded demo user: alex@example.com / password123');
  }

  // Seed demo Admin Parth Parsekar if not exists
  let admin = await User.findOne({ email: 'admin@kys.app' });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    admin = await User.create({
      name: 'Parth Parsekar',
      email: 'admin@kys.app',
      passwordHash: hash,
      role: 'admin',
      preferredCurrency: 'USD',
      timezone: 'America/Los_Angeles',
      monthlyBudget: 500,
      alertThreshold: 80,
      notifyOnThreshold: true,
    });
    console.log('Seeded demo admin: admin@kys.app / admin123');
  }

  // Check if Alex has subscriptions seeded
  const alexSubsCount = await Subscription.countDocuments({ user: alex._id });
  if (alexSubsCount === 0) {
    console.log('Seeding Alex Morgan subscription dataset matching wireframes...');
    const now = new Date();

    const subsData = [
      { serviceName: 'Netflix', category: 'Entertainment', amount: 23.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 2, status: 'Active' },
      { serviceName: 'Spotify', category: 'Entertainment', amount: 12.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 3, status: 'Active' },
      { serviceName: 'Figma', category: 'Productivity', amount: 180.0, currency: 'USD', billingFrequency: 'Yearly', daysOffset: 5, status: 'Active' },
      { serviceName: 'Dropbox', category: 'Storage', amount: 144.0, currency: 'USD', billingFrequency: 'Yearly', daysOffset: 7, status: 'Active' },
      { serviceName: 'Notion', category: 'Productivity', amount: 30.0, currency: 'USD', billingFrequency: 'Quarterly', daysOffset: 10, status: 'Active' },
      { serviceName: 'Adobe', category: 'Work tools', amount: 120.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 12, status: 'Active' },
      { serviceName: 'Slack', category: 'Productivity', amount: 9.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 14, status: 'Active' },
      { serviceName: 'Zoom', category: 'Work tools', amount: 16.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 15, status: 'Active' },
      { serviceName: 'GitHub', category: 'Work tools', amount: 4.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 17, status: 'Active' },
      { serviceName: 'iCloud', category: 'Storage', amount: 3.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 18, status: 'Active' },
      { serviceName: 'YouTube', category: 'Entertainment', amount: 14.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 21, status: 'Active' },
      { serviceName: 'Linear', category: 'Productivity', amount: 10.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 23, status: 'Active' },
      { serviceName: 'Trello', category: 'Productivity', amount: 2.0, currency: 'USD', billingFrequency: 'Weekly', daysOffset: 4, status: 'Paused' },
      { serviceName: 'Canva', category: 'Productivity', amount: 15.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 11, status: 'Cancelled' },
      { serviceName: 'AWS', category: 'Work tools', amount: 20.0, currency: 'USD', billingFrequency: 'Monthly', daysOffset: 8, status: 'Expired' },
    ];

    for (const item of subsData) {
      const nextRenewal = new Date(now.getTime() + item.daysOffset * 24 * 60 * 60 * 1000);
      const startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const sub = await Subscription.create({
        user: alex._id,
        serviceName: item.serviceName,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        billingFrequency: item.billingFrequency,
        startDate,
        nextRenewalDate: nextRenewal,
        status: item.status,
      });

      // Seed 2 billing events for Netflix and Spotify
      if (item.serviceName === 'Netflix') {
        await BillingHistory.create({
          user: alex._id,
          subscription: sub._id,
          billingAmount: 23.0,
          currency: 'USD',
          billingDate: new Date('2025-11-12'),
          billingStatus: 'Paid',
          eventType: 'Initial',
          dataSource: 'simulated',
        });
        await BillingHistory.create({
          user: alex._id,
          subscription: sub._id,
          billingAmount: 23.0,
          currency: 'USD',
          billingDate: new Date('2026-10-12'),
          billingStatus: 'Paid',
          eventType: 'Renewal',
          dataSource: 'simulated',
        });
      }
    }

    // Seed Notifications matching wireframe Screen 05
    const netflixSub = await Subscription.findOne({ user: alex._id, serviceName: 'Netflix' });
    const spotifySub = await Subscription.findOne({ user: alex._id, serviceName: 'Spotify' });

    await Notification.create([
      {
        user: alex._id,
        subscription: netflixSub?._id,
        type: 'renewal_upcoming',
        title: 'Netflix renews in 2 days',
        message: '$23.00 USD · Nov 12, 2026',
        renewalCycleIdentifier: `renewal_${netflixSub?._id}_2026-11-12`,
        isRead: false,
        createdAt: new Date(),
      },
      {
        user: alex._id,
        subscription: spotifySub?._id,
        type: 'renewal_upcoming',
        title: 'Spotify renews in 3 days',
        message: '$12.00 USD · Nov 13, 2026',
        renewalCycleIdentifier: `renewal_${spotifySub?._id}_2026-11-13`,
        isRead: false,
        createdAt: new Date(),
      },
      {
        user: alex._id,
        type: 'budget_threshold',
        title: 'Monthly budget threshold reached',
        message: '$248 of $300 · 83% used · Threshold: 80%',
        renewalCycleIdentifier: `budget_${alex._id}_2026_11_80`,
        isRead: false,
        createdAt: new Date(),
      },
      {
        user: alex._id,
        type: 'renewal_upcoming',
        title: 'Notion renewal reminder',
        message: '$30.00 USD · Nov 20, 2025',
        renewalCycleIdentifier: `renewal_notion_earlier`,
        isRead: true,
        createdAt: new Date('2025-11-17T09:00:00Z'),
      },
      {
        user: alex._id,
        type: 'renewal_upcoming',
        title: 'Dropbox renewal reminder',
        message: '$144.00 USD · Nov 17, 2025',
        renewalCycleIdentifier: `renewal_dropbox_earlier`,
        isRead: true,
        createdAt: new Date('2025-11-14T09:00:00Z'),
      },
    ]);

    console.log('Alex Morgan demo subscription & notification dataset seeded successfully.');
  }
}

