import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { BillingHistory } from '../models/BillingHistory.js';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://parsekarparth_db_user:65o49nIkk2JzM6tw@kys-cluster.1ivczqq.mongodb.net/kys?retryWrites=true&w=majority';

// 50 Humane, realistic names across diverse backgrounds
const DEMO_USERS_DATA = [
  { name: 'Sarah Jenkins', email: 'sarah.jenkins@gmail.com', tz: 'America/New_York', budget: 250 },
  { name: 'Liam Chen', email: 'liam.chen@outlook.com', tz: 'America/Los_Angeles', budget: 320 },
  { name: 'Elena Rodriguez', email: 'elena.rodriguez@icloud.com', tz: 'America/Chicago', budget: 280 },
  { name: 'Marcus Vance', email: 'marcus.vance@gmail.com', tz: 'America/Denver', budget: 200 },
  { name: 'Maya Patel', email: 'maya.patel@proton.me', tz: 'America/New_York', budget: 350 },
  { name: 'Lucas Silva', email: 'lucas.silva@yahoo.com', tz: 'America/Los_Angeles', budget: 220 },
  { name: 'Chloe Bennett', email: 'chloe.bennett@gmail.com', tz: 'America/Chicago', budget: 310 },
  { name: 'Oliver Wright', email: 'oliver.wright@outlook.com', tz: 'America/New_York', budget: 275 },
  { name: 'Aaliyah Brooks', email: 'aaliyah.brooks@gmail.com', tz: 'America/Chicago', budget: 240 },
  { name: 'Noah Takahashi', email: 'noah.takahashi@gmail.com', tz: 'America/Los_Angeles', budget: 380 },
  { name: 'Emily Watson', email: 'emily.watson@icloud.com', tz: 'America/New_York', budget: 190 },
  { name: 'Ethan Davis', email: 'ethan.davis@gmail.com', tz: 'America/Denver', budget: 300 },
  { name: 'Sophia Martinez', email: 'sophia.martinez@gmail.com', tz: 'America/Chicago', budget: 260 },
  { name: 'Daniel Kim', email: 'daniel.kim@outlook.com', tz: 'America/Los_Angeles', budget: 340 },
  { name: 'Isabella Rossi', email: 'isabella.rossi@gmail.com', tz: 'America/New_York', budget: 225 },
  { name: 'Mason Taylor', email: 'mason.taylor@gmail.com', tz: 'America/Chicago', budget: 290 },
  { name: 'Olivia Johansson', email: 'olivia.johansson@proton.me', tz: 'America/New_York', budget: 310 },
  { name: 'Alexander Hayes', email: 'alexander.hayes@outlook.com', tz: 'America/Denver', budget: 230 },
  { name: 'Ava Sharma', email: 'ava.sharma@gmail.com', tz: 'America/New_York', budget: 270 },
  { name: 'Benjamin Scott', email: 'benjamin.scott@gmail.com', tz: 'America/Los_Angeles', budget: 360 },
  { name: 'Mia Hernandez', email: 'mia.hernandez@icloud.com', tz: 'America/Chicago', budget: 210 },
  { name: 'Henry Zhao', email: 'henry.zhao@gmail.com', tz: 'America/Los_Angeles', budget: 330 },
  { name: 'Charlotte Cooper', email: 'charlotte.cooper@gmail.com', tz: 'America/New_York', budget: 250 },
  { name: 'Jackson Reed', email: 'jackson.reed@outlook.com', tz: 'America/Denver', budget: 180 },
  { name: 'Harper Evans', email: 'harper.evans@gmail.com', tz: 'America/Chicago', budget: 295 },
  { name: 'Sebastian Mueller', email: 'sebastian.mueller@proton.me', tz: 'America/New_York', budget: 320 },
  { name: 'Amelia Foster', email: 'amelia.foster@gmail.com', tz: 'America/Los_Angeles', budget: 240 },
  { name: 'Aiden Murphy', email: 'aiden.murphy@gmail.com', tz: 'America/Chicago', budget: 280 },
  { name: 'Evelyn Campbell', email: 'evelyn.campbell@icloud.com', tz: 'America/New_York', budget: 300 },
  { name: 'Matthew Rivera', email: 'matthew.rivera@outlook.com', tz: 'America/Denver', budget: 215 },
  { name: 'Abigail Bell', email: 'abigail.bell@gmail.com', tz: 'America/Chicago', budget: 260 },
  { name: 'David Dubois', email: 'david.dubois@gmail.com', tz: 'America/New_York', budget: 350 },
  { name: 'Emily Zhang', email: 'emily.zhang@proton.me', tz: 'America/Los_Angeles', budget: 285 },
  { name: 'Joseph Morales', email: 'joseph.morales@gmail.com', tz: 'America/Chicago', budget: 220 },
  { name: 'Ella Fischer', email: 'ella.fischer@gmail.com', tz: 'America/New_York', budget: 310 },
  { name: 'Samuel Ortiz', email: 'samuel.ortiz@outlook.com', tz: 'America/Denver', budget: 275 },
  { name: 'Grace Kelly', email: 'grace.kelly@icloud.com', tz: 'America/Los_Angeles', budget: 340 },
  { name: 'Gabriel Santos', email: 'gabriel.santos@gmail.com', tz: 'America/New_York', budget: 230 },
  { name: 'Hannah Baker', email: 'hannah.baker@gmail.com', tz: 'America/Chicago', budget: 290 },
  { name: 'Carter Adams', email: 'carter.adams@outlook.com', tz: 'America/Denver', budget: 250 },
  { name: 'Zoe Tanaka', email: 'zoe.tanaka@gmail.com', tz: 'America/Los_Angeles', budget: 370 },
  { name: 'Julian Price', email: 'julian.price@gmail.com', tz: 'America/New_York', budget: 260 },
  { name: 'Stella Novak', email: 'stella.novak@proton.me', tz: 'America/Chicago', budget: 225 },
  { name: 'Leo Larsen', email: 'leo.larsen@gmail.com', tz: 'America/Denver', budget: 315 },
  { name: 'Victoria Flores', email: 'victoria.flores@icloud.com', tz: 'America/New_York', budget: 280 },
  { name: 'Anthony Griffin', email: 'anthony.griffin@outlook.com', tz: 'America/Los_Angeles', budget: 330 },
  { name: 'Penelope Diaz', email: 'penelope.diaz@gmail.com', tz: 'America/Chicago', budget: 245 },
  { name: 'Christian Meyer', email: 'christian.meyer@gmail.com', tz: 'America/New_York', budget: 300 },
  { name: 'Natalie Hughes', email: 'natalie.hughes@gmail.com', tz: 'America/Denver', budget: 210 },
  { name: 'Caleb Henderson', email: 'caleb.henderson@outlook.com', tz: 'America/Los_Angeles', budget: 360 },
];

// Rich catalog of realistic subscriptions
interface SubTemplate {
  serviceName: string;
  category: 'Entertainment' | 'Work tools' | 'Productivity' | 'Storage' | 'Utilities';
  amount: number;
  billingFrequency: 'Monthly' | 'Quarterly' | 'Yearly';
  notes: string;
}

const SERVICE_TEMPLATES: SubTemplate[] = [
  { serviceName: 'Netflix', category: 'Entertainment', amount: 22.99, billingFrequency: 'Monthly', notes: 'Premium 4K UHD 4-screen plan' },
  { serviceName: 'Spotify', category: 'Entertainment', amount: 11.99, billingFrequency: 'Monthly', notes: 'Individual Premium account' },
  { serviceName: 'YouTube Premium', category: 'Entertainment', amount: 13.99, billingFrequency: 'Monthly', notes: 'Ad-free and background play' },
  { serviceName: 'Disney+', category: 'Entertainment', amount: 13.99, billingFrequency: 'Monthly', notes: 'Trio Basic streaming bundle' },
  { serviceName: 'HBO Max', category: 'Entertainment', amount: 16.99, billingFrequency: 'Monthly', notes: 'Ad-free standard plan' },
  { serviceName: 'Apple Music', category: 'Entertainment', amount: 10.99, billingFrequency: 'Monthly', notes: 'Lossless audio streaming' },

  { serviceName: 'GitHub Copilot', category: 'Work tools', amount: 10.0, billingFrequency: 'Monthly', notes: 'Individual AI code assistant' },
  { serviceName: 'GitHub', category: 'Work tools', amount: 4.0, billingFrequency: 'Monthly', notes: 'Pro account for private repo actions' },
  { serviceName: 'AWS', category: 'Work tools', amount: 28.5, billingFrequency: 'Monthly', notes: 'EC2, S3 & CloudFront dev tier' },
  { serviceName: 'Vercel', category: 'Work tools', amount: 20.0, billingFrequency: 'Monthly', notes: 'Pro plan for team frontend deployments' },
  { serviceName: 'ChatGPT Plus', category: 'Work tools', amount: 20.0, billingFrequency: 'Monthly', notes: 'OpenAI GPT-4o subscription' },
  { serviceName: 'Adobe Creative Cloud', category: 'Work tools', amount: 59.99, billingFrequency: 'Monthly', notes: 'All Apps photography and video package' },
  { serviceName: 'JetBrains All Products', category: 'Work tools', amount: 28.9, billingFrequency: 'Monthly', notes: 'IDE pack: WebStorm, IntelliJ, PyCharm' },

  { serviceName: 'Figma', category: 'Productivity', amount: 15.0, billingFrequency: 'Monthly', notes: 'Professional UI/UX collaboration license' },
  { serviceName: 'Notion', category: 'Productivity', amount: 30.0, billingFrequency: 'Quarterly', notes: 'Plus plan quarterly workspace' },
  { serviceName: 'Slack', category: 'Productivity', amount: 8.75, billingFrequency: 'Monthly', notes: 'Pro tier unlimited message history' },
  { serviceName: 'Linear', category: 'Productivity', amount: 10.0, billingFrequency: 'Monthly', notes: 'Standard issue tracking for agile teams' },
  { serviceName: 'Canva Pro', category: 'Productivity', amount: 14.99, billingFrequency: 'Monthly', notes: 'Brand kit and template access' },
  { serviceName: 'Google Workspace', category: 'Productivity', amount: 12.0, billingFrequency: 'Monthly', notes: 'Business Standard custom domain email' },
  { serviceName: 'Trello', category: 'Productivity', amount: 5.0, billingFrequency: 'Monthly', notes: 'Standard plan board automation' },

  { serviceName: 'Dropbox', category: 'Storage', amount: 119.88, billingFrequency: 'Yearly', notes: '2TB Plus individual cloud storage' },
  { serviceName: 'iCloud+', category: 'Storage', amount: 2.99, billingFrequency: 'Monthly', notes: '200GB family cloud tier' },
  { serviceName: 'Google One', category: 'Storage', amount: 19.99, billingFrequency: 'Yearly', notes: '100GB photo backup storage' },

  { serviceName: '1Password', category: 'Utilities', amount: 35.88, billingFrequency: 'Yearly', notes: 'Individual password security vault' },
  { serviceName: 'NordVPN', category: 'Utilities', amount: 59.88, billingFrequency: 'Yearly', notes: 'Secure encrypted tunneling proxy' },
  { serviceName: 'CleanMyMac', category: 'Utilities', amount: 39.95, billingFrequency: 'Yearly', notes: 'System maintenance & cleanup license' },
];

async function seed50DemoUsers() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully.\n');

  // Generate reusable bcrypt hash for "password123"
  console.log('Generating password hash for "password123"...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  console.log('Password hash ready.\n');

  const currentDate = new Date('2026-11-10T00:00:00.000Z');
  let totalSubsCreated = 0;
  let totalBillingsCreated = 0;

  for (let uIdx = 0; uIdx < DEMO_USERS_DATA.length; uIdx++) {
    const userData = DEMO_USERS_DATA[uIdx];

    // Find or create user
    let user = await User.findOne({ email: userData.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: userData.name,
        email: userData.email.toLowerCase(),
        passwordHash,
        role: 'user',
        preferredCurrency: 'USD',
        timezone: userData.tz,
        monthlyBudget: userData.budget,
        alertThreshold: 80,
        notifyOnThreshold: true,
      });
    } else {
      user.preferredCurrency = 'USD';
      user.monthlyBudget = userData.budget;
      await user.save();
      // Clean previous data for idempotent re-run
      const existingSubs = await Subscription.find({ user: user._id });
      const subIds = existingSubs.map((s) => s._id);
      await BillingHistory.deleteMany({ subscription: { $in: subIds } });
      await Subscription.deleteMany({ user: user._id });
    }

    // Select 4 to 7 realistic subscriptions per user (deterministically varied by user index)
    const numSubs = 4 + (uIdx % 4); // 4, 5, 6, or 7
    const userTemplates: SubTemplate[] = [];

    // Guarantee 1 entertainment, 1 work tool, 1 productivity, 1 storage/utility, + extras
    const entPool = SERVICE_TEMPLATES.filter((s) => s.category === 'Entertainment');
    const workPool = SERVICE_TEMPLATES.filter((s) => s.category === 'Work tools');
    const prodPool = SERVICE_TEMPLATES.filter((s) => s.category === 'Productivity');
    const storePool = SERVICE_TEMPLATES.filter((s) => s.category === 'Storage' || s.category === 'Utilities');

    userTemplates.push(entPool[uIdx % entPool.length]);
    userTemplates.push(workPool[(uIdx * 2) % workPool.length]);
    userTemplates.push(prodPool[(uIdx * 3) % prodPool.length]);
    userTemplates.push(storePool[uIdx % storePool.length]);

    if (numSubs >= 5) {
      userTemplates.push(workPool[(uIdx + 3) % workPool.length]);
    }
    if (numSubs >= 6) {
      userTemplates.push(entPool[(uIdx + 2) % entPool.length]);
    }
    if (numSubs >= 7) {
      userTemplates.push(prodPool[(uIdx + 4) % prodPool.length]);
    }

    // Deduplicate by serviceName
    const uniqueTemplates = Array.from(new Map(userTemplates.map((t) => [t.serviceName, t])).values());

    for (let sIdx = 0; sIdx < uniqueTemplates.length; sIdx++) {
      const tmpl = uniqueTemplates[sIdx];

      // Stagger start dates 12 to 14 months prior (between Sept 2025 and Nov 2025)
      // Month offset: -12, -13, or -14
      const monthsBack = 12 + ((uIdx + sIdx) % 3);
      const billingDay = 1 + ((uIdx * 7 + sIdx * 5) % 27); // day 1 to 28
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthsBack, billingDay);

      // Determine next renewal date in Nov / Dec 2026
      let nextRenewalDate: Date;
      if (tmpl.billingFrequency === 'Yearly') {
        nextRenewalDate = new Date(startDate);
        nextRenewalDate.setFullYear(startDate.getFullYear() + 1);
        if (nextRenewalDate <= currentDate) {
          nextRenewalDate.setFullYear(startDate.getFullYear() + 2);
        }
      } else if (tmpl.billingFrequency === 'Quarterly') {
        nextRenewalDate = new Date(2026, 11, billingDay); // Dec 2026
      } else {
        // Monthly
        nextRenewalDate = new Date(2026, 10, billingDay); // Nov 2026
        if (nextRenewalDate <= currentDate) {
          nextRenewalDate = new Date(2026, 11, billingDay); // Dec 2026
        }
      }

      // Status: 90% Active, 10% Paused
      const status = (uIdx + sIdx) % 10 === 0 ? 'Paused' : 'Active';

      const sub = await Subscription.create({
        user: user._id,
        serviceName: tmpl.serviceName,
        category: tmpl.category,
        amount: tmpl.amount,
        currency: 'USD',
        billingFrequency: tmpl.billingFrequency,
        startDate,
        nextRenewalDate,
        status,
        customService: false,
        notes: tmpl.notes,
      });

      totalSubsCreated++;

      // Generate 12 months of prior BillingHistory events
      // For each past cycle within the last 12 months (Nov 2025 to Nov 2026)
      const billingEventsToInsert = [];

      if (tmpl.billingFrequency === 'Monthly') {
        for (let m = monthsBack; m >= 1; m--) {
          const billingDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - m, billingDay);
          billingEventsToInsert.push({
            user: user._id,
            subscription: sub._id,
            billingAmount: tmpl.amount,
            currency: 'USD',
            billingDate,
            billingStatus: 'Paid',
            eventType: m === monthsBack ? 'Initial' : 'Renewal',
            dataSource: 'simulated',
            notes: `${tmpl.serviceName} monthly billing cycle`,
          });
        }
      } else if (tmpl.billingFrequency === 'Quarterly') {
        for (let m = monthsBack; m >= 1; m -= 3) {
          const billingDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - m, billingDay);
          billingEventsToInsert.push({
            user: user._id,
            subscription: sub._id,
            billingAmount: tmpl.amount,
            currency: 'USD',
            billingDate,
            billingStatus: 'Paid',
            eventType: m === monthsBack ? 'Initial' : 'Renewal',
            dataSource: 'simulated',
            notes: `${tmpl.serviceName} quarterly billing cycle`,
          });
        }
      } else if (tmpl.billingFrequency === 'Yearly') {
        // Annual event 12 months ago
        const billingDate = new Date(startDate);
        billingEventsToInsert.push({
          user: user._id,
          subscription: sub._id,
          billingAmount: tmpl.amount,
          currency: 'USD',
          billingDate,
          billingStatus: 'Paid',
          eventType: 'Initial',
          dataSource: 'simulated',
          notes: `${tmpl.serviceName} annual subscription payment`,
        });
      }

      if (billingEventsToInsert.length > 0) {
        await BillingHistory.insertMany(billingEventsToInsert);
        totalBillingsCreated += billingEventsToInsert.length;
      }
    }

    if ((uIdx + 1) % 10 === 0 || uIdx === DEMO_USERS_DATA.length - 1) {
      console.log(`Progress: Processed ${uIdx + 1}/${DEMO_USERS_DATA.length} users...`);
    }
  }

  console.log('\n======================================================');
  console.log(' SEEDING COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log(`Total Users Added / Updated:    ${DEMO_USERS_DATA.length}`);
  console.log(`Total Subscriptions Created:    ${totalSubsCreated}`);
  console.log(`Total Billing Events Inserted:  ${totalBillingsCreated}`);
  console.log(`All Currencies Pegged To:       USD ($)`);
  console.log(`Default Password For All Users: password123`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB Atlas.');
}

seed50DemoUsers().catch((err) => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
