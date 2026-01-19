const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@mypollingapp.com' },
    update: {},
    create: {
      email: 'admin@mypollingapp.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN'
    }
  });

  const pollAdmin = await prisma.user.upsert({
    where: { email: 'polladmin@mypollingapp.com' },
    update: {},
    create: {
      email: 'polladmin@mypollingapp.com',
      password: hashedPassword,
      name: 'Poll Admin',
      role: 'POLL_ADMIN'
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@mypollingapp.com' },
    update: {},
    create: {
      email: 'user@mypollingapp.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'USER'
    }
  });

  console.log('Created users:', { superAdmin: superAdmin.email, pollAdmin: pollAdmin.email, user: user.email });

  // Create subscriptions for demo users
  const subscriptions = [
    { userId: superAdmin.id, plan: 'ENTERPRISE', status: 'ACTIVE' },
    { userId: pollAdmin.id, plan: 'PROFESSIONAL', status: 'ACTIVE' },
    { userId: user.id, plan: 'FREE', status: 'ACTIVE' }
  ];

  for (const sub of subscriptions) {
    await prisma.subscription.upsert({
      where: { userId: sub.userId },
      update: { plan: sub.plan },
      create: sub
    });
  }

  console.log('Created subscriptions for demo users');

  // Create subscription plans
  const subscriptionPlans = [
    {
      name: 'free',
      displayName: 'Free Trial',
      description: 'Perfect for trying out the platform',
      price: 0,
      interval: 'month',
      features: JSON.stringify(['1 active poll', '50 responses per poll', 'Basic analytics', 'Community support']),
      limits: JSON.stringify({ polls: 1, responses: 50 }),
      trialDays: 14,
      sortOrder: 0
    },
    {
      name: 'starter',
      displayName: 'Starter',
      description: 'Great for individuals and small teams',
      price: 9.99,
      interval: 'month',
      features: JSON.stringify(['5 active polls', '500 responses per poll', 'Advanced analytics', 'Email support', 'Custom branding']),
      limits: JSON.stringify({ polls: 5, responses: 500 }),
      trialDays: 7,
      sortOrder: 1
    },
    {
      name: 'professional',
      displayName: 'Professional',
      description: 'For growing organizations',
      price: 29.99,
      interval: 'month',
      features: JSON.stringify(['Unlimited polls', 'Unlimited responses', 'Team collaboration', 'Priority support', 'API access', 'Advanced integrations']),
      limits: JSON.stringify({ polls: -1, responses: -1 }),
      trialDays: 14,
      sortOrder: 2
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'For large organizations with custom needs',
      price: 99.99,
      interval: 'month',
      features: JSON.stringify(['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise deployment', 'White-label solution']),
      limits: JSON.stringify({ polls: -1, responses: -1, custom: true }),
      trialDays: 30,
      sortOrder: 3
    }
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan
    });
  }

  console.log('Created subscription plans');

  // Create system poll types
  const pollTypes = [
    { code: 'single_choice', name: 'Single Choice', description: 'Select one option from a list', icon: '⭕', category: 'choice', defaultConfig: '{}', sortOrder: 0 },
    { code: 'multiple_choice', name: 'Multiple Choice', description: 'Select multiple options', icon: '☑️', category: 'choice', defaultConfig: '{}', sortOrder: 1 },
    { code: 'yes_no', name: 'Yes / No', description: 'Simple binary choice', icon: '👍', category: 'choice', defaultConfig: '{}', sortOrder: 2 },
    { code: 'rating_scale', name: 'Rating Scale', description: 'Rate on a scale', icon: '⭐', category: 'rating', defaultConfig: '{"maxValue":5,"style":"stars"}', sortOrder: 3 },
    { code: 'nps', name: 'Net Promoter Score', description: 'How likely to recommend (0-10)', icon: '📊', category: 'rating', defaultConfig: '{}', sortOrder: 4 },
    { code: 'ranked', name: 'Ranked Choice', description: 'Rank options in order', icon: '🏆', category: 'ranking', defaultConfig: '{}', sortOrder: 5 },
    { code: 'open_text', name: 'Open Text', description: 'Free-form text response', icon: '💬', category: 'text', defaultConfig: '{}', sortOrder: 6 }
  ];

  const createdPollTypes = {};
  for (const type of pollTypes) {
    const created = await prisma.pollType.upsert({
      where: { code: type.code },
      update: {},
      create: type
    });
    createdPollTypes[type.code] = created.id;
  }

  console.log('Created poll types:', Object.keys(createdPollTypes));

  // Create sample polls
  await prisma.poll.upsert({
    where: { id: 'sample-poll-1' },
    update: {},
    create: {
      id: 'sample-poll-1',
      title: 'What is your favorite programming language?',
      description: 'Vote for the programming language you enjoy working with the most.',
      type: 'single',
      status: 'open',
      creatorId: superAdmin.id,
      pollTypeId: createdPollTypes['single_choice'],
      options: {
        create: [
          { label: 'JavaScript/TypeScript', orderIndex: 0 },
          { label: 'Python', orderIndex: 1 },
          { label: 'Rust', orderIndex: 2 },
          { label: 'Go', orderIndex: 3 }
        ]
      }
    }
  });

  await prisma.poll.upsert({
    where: { id: 'sample-poll-2' },
    update: {},
    create: {
      id: 'sample-poll-2',
      title: 'Best AI Assistant?',
      description: 'Which AI assistant do you find most helpful for coding?',
      type: 'single',
      status: 'open',
      creatorId: superAdmin.id,
      pollTypeId: createdPollTypes['single_choice'],
      options: {
        create: [
          { label: 'Claude', orderIndex: 0 },
          { label: 'ChatGPT', orderIndex: 1 },
          { label: 'Copilot', orderIndex: 2 },
          { label: 'Gemini', orderIndex: 3 }
        ]
      }
    }
  });

  console.log('Created sample polls');

  // Create default system settings
  const settings = [
    { key: 'businessName', value: 'MyPollingApp', category: 'branding' },
    { key: 'tagline', value: 'Voice-Enabled Polling', category: 'branding' },
    { key: 'primaryColor', value: '#7c3aed', category: 'branding' },
    { key: 'secondaryColor', value: '#4f46e5', category: 'branding' }
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log('Created system settings');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
