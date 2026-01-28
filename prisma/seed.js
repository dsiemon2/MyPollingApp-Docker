const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Owner account
  const ownerPassword = await bcrypt.hash('Numb3r1$', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'dsiemon2@gmail.com' },
    update: { password: ownerPassword, role: 'SUPER_ADMIN' },
    create: {
      email: 'dsiemon2@gmail.com',
      password: ownerPassword,
      name: 'David Siemon',
      role: 'SUPER_ADMIN'
    }
  });

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

  console.log('Created users:', {
    owner: owner.email,
    superAdmin: superAdmin.email,
    pollAdmin: pollAdmin.email,
    user: user.email
  });

  // Create subscriptions for demo users
  const subscriptions = [
    { userId: owner.id, plan: 'ENTERPRISE', status: 'ACTIVE' },
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

  // Create system poll types with detailed config
  const pollTypes = [
    {
      code: 'single_choice',
      name: 'Single Choice',
      description: 'Select one option from a list (radio buttons)',
      icon: '⭕',
      category: 'choice',
      defaultConfig: JSON.stringify({
        minSelections: 1,
        maxSelections: 1,
        randomizeOrder: false,
        showAsCards: false,
        allowOther: false
      }),
      sortOrder: 0
    },
    {
      code: 'multiple_choice',
      name: 'Multiple Choice',
      description: 'Select multiple options (checkboxes)',
      icon: '☑️',
      category: 'choice',
      defaultConfig: JSON.stringify({
        minSelections: 1,
        maxSelections: null,
        randomizeOrder: false,
        showAsCards: false,
        allowOther: false
      }),
      sortOrder: 1
    },
    {
      code: 'yes_no',
      name: 'Yes / No',
      description: 'Simple binary choice with optional neutral option',
      icon: '👍',
      category: 'choice',
      defaultConfig: JSON.stringify({
        yesLabel: 'Yes',
        noLabel: 'No',
        allowNeutral: false,
        neutralLabel: 'Not Sure'
      }),
      sortOrder: 2
    },
    {
      code: 'rating_scale',
      name: 'Rating Scale',
      description: 'Rate on a scale (stars, numbers, etc.)',
      icon: '⭐',
      category: 'rating',
      defaultConfig: JSON.stringify({
        minValue: 1,
        maxValue: 5,
        step: 1,
        style: 'stars',
        lowLabel: 'Poor',
        highLabel: 'Excellent',
        showLabels: true
      }),
      sortOrder: 3
    },
    {
      code: 'nps',
      name: 'Net Promoter Score',
      description: 'How likely to recommend (0-10 scale)',
      icon: '📊',
      category: 'rating',
      defaultConfig: JSON.stringify({
        minValue: 0,
        maxValue: 10,
        lowLabel: 'Not at all likely',
        highLabel: 'Extremely likely'
      }),
      sortOrder: 4
    },
    {
      code: 'ranked',
      name: 'Ranked Choice',
      description: 'Rank options in order of preference',
      icon: '🏆',
      category: 'ranking',
      defaultConfig: JSON.stringify({
        maxRankings: 3,
        pointSystem: [3, 2, 1],
        inputMethod: 'dropdown'
      }),
      sortOrder: 5
    },
    {
      code: 'open_text',
      name: 'Open Text',
      description: 'Free-form text response',
      icon: '💬',
      category: 'text',
      defaultConfig: JSON.stringify({
        multiline: true,
        maxLength: 500,
        placeholder: 'Enter your response...',
        required: true
      }),
      sortOrder: 6
    }
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

  // Create poll templates
  const pollTemplates = [
    {
      name: 'Quick Poll',
      description: 'Simple single-choice poll for quick decisions',
      icon: '⚡',
      category: 'general',
      pollTypeId: createdPollTypes['single_choice'],
      defaultTitle: '',
      defaultDescription: '',
      defaultOptions: JSON.stringify([]),
      defaultConfig: JSON.stringify({}),
      sortOrder: 0
    },
    {
      name: 'Customer Satisfaction',
      description: '5-star rating for feedback collection',
      icon: '😊',
      category: 'feedback',
      pollTypeId: createdPollTypes['rating_scale'],
      defaultTitle: 'How satisfied are you with our service?',
      defaultDescription: 'Please rate your experience',
      defaultOptions: JSON.stringify([]),
      defaultConfig: JSON.stringify({ style: 'stars', maxValue: 5 }),
      sortOrder: 1
    },
    {
      name: 'NPS Survey',
      description: 'Net Promoter Score question',
      icon: '📈',
      category: 'feedback',
      pollTypeId: createdPollTypes['nps'],
      defaultTitle: 'How likely are you to recommend us to a friend?',
      defaultDescription: '',
      defaultOptions: JSON.stringify([]),
      defaultConfig: JSON.stringify({}),
      sortOrder: 2
    },
    {
      name: 'Event RSVP',
      description: 'Yes/No/Maybe attendance poll',
      icon: '📅',
      category: 'events',
      pollTypeId: createdPollTypes['yes_no'],
      defaultTitle: 'Will you attend?',
      defaultDescription: '',
      defaultOptions: JSON.stringify([]),
      defaultConfig: JSON.stringify({
        allowNeutral: true,
        yesLabel: 'Yes, I will attend',
        noLabel: 'No, I cannot attend',
        neutralLabel: 'Maybe'
      }),
      sortOrder: 3
    },
    {
      name: 'Ranked Voting',
      description: 'Rank your top choices (3-2-1 points)',
      icon: '🥇',
      category: 'contests',
      pollTypeId: createdPollTypes['ranked'],
      defaultTitle: 'Rank your favorites',
      defaultDescription: 'Select your 1st, 2nd, and 3rd choices',
      defaultOptions: JSON.stringify([]),
      defaultConfig: JSON.stringify({ maxRankings: 3, pointSystem: [3, 2, 1] }),
      sortOrder: 4
    },
    {
      name: 'Open Feedback',
      description: 'Collect text responses and suggestions',
      icon: '📝',
      category: 'feedback',
      pollTypeId: createdPollTypes['open_text'],
      defaultTitle: 'Share your feedback',
      defaultDescription: 'We value your input',
      defaultOptions: JSON.stringify([]),
      defaultConfig: JSON.stringify({ multiline: true, maxLength: 1000 }),
      sortOrder: 5
    },
    {
      name: 'Team Meeting Poll',
      description: 'Choose meeting times or topics',
      icon: '👥',
      category: 'general',
      pollTypeId: createdPollTypes['multiple_choice'],
      defaultTitle: 'Which times work for you?',
      defaultDescription: 'Select all times that work',
      defaultOptions: JSON.stringify(['Monday 9 AM', 'Monday 2 PM', 'Tuesday 10 AM', 'Wednesday 3 PM']),
      defaultConfig: JSON.stringify({ maxSelections: null }),
      sortOrder: 6
    },
    {
      name: 'Product Feature Request',
      description: 'Let users rank feature priorities',
      icon: '🚀',
      category: 'feedback',
      pollTypeId: createdPollTypes['ranked'],
      defaultTitle: 'Which features should we prioritize?',
      defaultDescription: 'Rank the features by importance',
      defaultOptions: JSON.stringify(['Dark mode', 'Mobile app', 'API access', 'Integrations', 'Analytics']),
      defaultConfig: JSON.stringify({ maxRankings: 3, pointSystem: [5, 3, 1] }),
      sortOrder: 7
    }
  ];

  for (const template of pollTemplates) {
    await prisma.pollTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template
    });
  }

  console.log('Created poll templates:', pollTemplates.map(t => t.name));

  // Create sample polls with different poll types
  const poll1 = await prisma.poll.upsert({
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
          { label: 'Go', orderIndex: 3 },
          { label: 'Java', orderIndex: 4 },
          { label: 'C#', orderIndex: 5 }
        ]
      }
    }
  });

  const poll2 = await prisma.poll.upsert({
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
          { label: 'Gemini', orderIndex: 3 },
          { label: 'Other', orderIndex: 4 }
        ]
      }
    }
  });

  const poll3 = await prisma.poll.upsert({
    where: { id: 'sample-poll-3' },
    update: {},
    create: {
      id: 'sample-poll-3',
      title: 'Preferred Frontend Framework?',
      description: 'What is your go-to frontend framework for web development?',
      type: 'single',
      status: 'open',
      creatorId: pollAdmin.id,
      pollTypeId: createdPollTypes['single_choice'],
      options: {
        create: [
          { label: 'React', orderIndex: 0 },
          { label: 'Vue', orderIndex: 1 },
          { label: 'Svelte', orderIndex: 2 },
          { label: 'Angular', orderIndex: 3 },
          { label: 'Next.js', orderIndex: 4 },
          { label: 'Solid', orderIndex: 5 }
        ]
      }
    }
  });

  const poll4 = await prisma.poll.upsert({
    where: { id: 'sample-poll-4' },
    update: {},
    create: {
      id: 'sample-poll-4',
      title: 'How would you rate this application?',
      description: 'Help us improve by rating your experience.',
      type: 'single',
      status: 'open',
      creatorId: superAdmin.id,
      pollTypeId: createdPollTypes['rating_scale'],
      config: JSON.stringify({ style: 'stars', maxValue: 5 })
    }
  });

  const poll5 = await prisma.poll.upsert({
    where: { id: 'sample-poll-5' },
    update: {},
    create: {
      id: 'sample-poll-5',
      title: 'Would you recommend MyPollingApp to others?',
      description: 'A simple yes or no will do!',
      type: 'single',
      status: 'open',
      creatorId: pollAdmin.id,
      pollTypeId: createdPollTypes['yes_no'],
      config: JSON.stringify({ allowNeutral: true, neutralLabel: 'Maybe' })
    }
  });

  const poll6 = await prisma.poll.upsert({
    where: { id: 'sample-poll-6' },
    update: {},
    create: {
      id: 'sample-poll-6',
      title: 'How likely are you to recommend us?',
      description: 'Rate from 0 (not likely) to 10 (extremely likely)',
      type: 'single',
      status: 'open',
      creatorId: superAdmin.id,
      pollTypeId: createdPollTypes['nps'],
      config: JSON.stringify({})
    }
  });

  const poll7 = await prisma.poll.upsert({
    where: { id: 'sample-poll-7' },
    update: {},
    create: {
      id: 'sample-poll-7',
      title: 'Which features should we build next?',
      description: 'Select all the features you want to see.',
      type: 'multiple',
      status: 'open',
      creatorId: pollAdmin.id,
      pollTypeId: createdPollTypes['multiple_choice'],
      options: {
        create: [
          { label: 'Mobile App', orderIndex: 0 },
          { label: 'Slack Integration', orderIndex: 1 },
          { label: 'Email Reports', orderIndex: 2 },
          { label: 'Custom Themes', orderIndex: 3 },
          { label: 'Team Workspaces', orderIndex: 4 },
          { label: 'API Access', orderIndex: 5 }
        ]
      }
    }
  });

  const poll8 = await prisma.poll.upsert({
    where: { id: 'sample-poll-8' },
    update: {},
    create: {
      id: 'sample-poll-8',
      title: 'What feedback do you have for us?',
      description: 'Share your thoughts and suggestions.',
      type: 'single',
      status: 'open',
      creatorId: superAdmin.id,
      pollTypeId: createdPollTypes['open_text'],
      config: JSON.stringify({ multiline: true, maxLength: 1000 })
    }
  });

  console.log('Created sample polls');

  // Add sample votes to polls with options
  const pollsWithOptions = await prisma.poll.findMany({
    where: { options: { some: {} } },
    include: { options: true }
  });

  for (const poll of pollsWithOptions) {
    for (let i = 0; i < poll.options.length; i++) {
      const voteCount = Math.floor(Math.random() * 25) + 5;
      for (let j = 0; j < voteCount; j++) {
        try {
          await prisma.vote.create({
            data: {
              pollId: poll.id,
              optionId: poll.options[i].id,
              voterFingerprint: `seed_voter_${poll.id}_${i}_${j}`
            }
          });
        } catch (e) {
          // Ignore duplicate votes
        }
      }
    }
  }

  console.log('Added sample votes');

  // Create AI providers with API keys from environment
  const huggingfaceKey = process.env.HUGGINGFACE_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
  const groqKey = process.env.GROQ_API_KEY || '';

  const aiProviders = [
    {
      name: 'openai',
      displayName: 'OpenAI',
      apiKey: openaiKey || null,
      baseUrl: null,
      model: 'gpt-4o',
      enabled: true,
      isDefault: true
    },
    {
      name: 'anthropic',
      displayName: 'Anthropic (Claude)',
      apiKey: anthropicKey || null,
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-5-sonnet-20241022',
      enabled: !!anthropicKey,
      isDefault: false
    },
    {
      name: 'gemini',
      displayName: 'Google Gemini',
      apiKey: geminiKey || null,
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-1.5-pro',
      enabled: !!geminiKey,
      isDefault: false
    },
    {
      name: 'deepseek',
      displayName: 'DeepSeek',
      apiKey: deepseekKey || null,
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      enabled: !!deepseekKey,
      isDefault: false
    },
    {
      name: 'groq',
      displayName: 'Groq',
      apiKey: groqKey || null,
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-70b-versatile',
      enabled: !!groqKey,
      isDefault: false
    },
    {
      name: 'huggingface',
      displayName: 'Hugging Face',
      apiKey: huggingfaceKey || null,
      baseUrl: 'https://api-inference.huggingface.co',
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      enabled: true,
      isDefault: false
    }
  ];

  for (const provider of aiProviders) {
    await prisma.aIProvider.upsert({
      where: { name: provider.name },
      update: {
        displayName: provider.displayName,
        baseUrl: provider.baseUrl,
        model: provider.model,
        enabled: provider.enabled,
        isDefault: provider.isDefault,
        ...(provider.apiKey && { apiKey: provider.apiKey })
      },
      create: provider
    });
  }

  console.log('Created AI providers:', aiProviders.map(p => p.displayName));

  // Create built-in AI tools
  const builtinTools = [
    { name: 'calculator', displayName: 'Calculator', description: 'Perform mathematical calculations', type: 'builtin' },
    { name: 'calendar', displayName: 'Calendar', description: 'Check dates and schedule events', type: 'builtin' },
    { name: 'poll_results', displayName: 'Poll Results', description: 'Fetch current poll results', type: 'builtin' },
    { name: 'summarizer', displayName: 'Summarizer', description: 'Summarize chat discussions', type: 'builtin' },
    { name: 'vote_counter', displayName: 'Vote Counter', description: 'Count and analyze votes', type: 'builtin' },
    { name: 'trend_analyzer', displayName: 'Trend Analyzer', description: 'Analyze voting trends over time', type: 'builtin' }
  ];

  for (const tool of builtinTools) {
    await prisma.aITool.upsert({
      where: { name: tool.name },
      update: {},
      create: tool
    });
  }

  console.log('Created AI tools');

  // Create sample voices
  const voices = [
    { voiceId: 'alloy', name: 'Alloy', gender: 'neutral', provider: 'openai', isDefault: true },
    { voiceId: 'echo', name: 'Echo', gender: 'male', provider: 'openai', isDefault: false },
    { voiceId: 'fable', name: 'Fable', gender: 'male', provider: 'openai', isDefault: false },
    { voiceId: 'onyx', name: 'Onyx', gender: 'male', provider: 'openai', isDefault: false },
    { voiceId: 'nova', name: 'Nova', gender: 'female', provider: 'openai', isDefault: false },
    { voiceId: 'shimmer', name: 'Shimmer', gender: 'female', provider: 'openai', isDefault: false }
  ];

  for (const voice of voices) {
    await prisma.voice.upsert({
      where: { voiceId: voice.voiceId },
      update: {},
      create: voice
    });
  }

  console.log('Created voices');

  // Create languages (24 languages, all enabled - matching Tutor_AI)
  const languages = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: true },
    { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', enabled: true },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', enabled: true },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', enabled: true },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', enabled: true },
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', enabled: true },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', enabled: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: true },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', enabled: true },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', enabled: true },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true }
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: { enabled: true },
      create: lang
    });
  }

  console.log('Created 24 languages');

  // Create default system settings
  const settings = [
    { key: 'businessName', value: 'PoligoPro', category: 'branding' },
    { key: 'tagline', value: 'Voice-Enabled Polling', category: 'branding' },
    { key: 'primaryColor', value: '#7c3aed', category: 'branding' },
    { key: 'secondaryColor', value: '#4f46e5', category: 'branding' },
    { key: 'logoUrl', value: '/images/PoligoPro.png', category: 'branding' },
    // Twilio SMS settings
    { key: 'twilio_account_sid', value: process.env.TWILIO_ACCOUNT_SID || '', category: 'sms' },
    { key: 'twilio_auth_token', value: process.env.TWILIO_AUTH_TOKEN || '', category: 'sms' },
    { key: 'twilio_phone_number', value: process.env.TWILIO_PHONE_NUMBER || '', category: 'sms' },
    { key: 'sms_enabled', value: 'true', category: 'sms' },
    // AI Assistant settings
    { key: 'ai_assistant_enabled', value: 'true', category: 'ai_assistant' },
    { key: 'ai_assistant_position', value: 'bottom-right', category: 'ai_assistant' },
    { key: 'ai_assistant_button_color', value: '#1e40af', category: 'ai_assistant' },
    { key: 'ai_assistant_panel_width', value: '380', category: 'ai_assistant' },
    { key: 'ai_assistant_voice_enabled', value: 'true', category: 'ai_assistant' },
    { key: 'ai_assistant_show_on_public', value: 'true', category: 'ai_assistant' },
    { key: 'ai_assistant_show_on_admin', value: 'true', category: 'ai_assistant' }
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log('Created system settings');

  // Create AI Config settings
  const aiConfigs = [
    { key: 'systemPrompt', value: 'You are MyPollingApp Assistant, a helpful AI that helps users understand and engage with polls. You can explain poll results, suggest voting strategies, and answer questions about the polling topics. Be friendly, concise, and helpful.' },
    { key: 'temperature', value: '0.7' },
    { key: 'maxTokens', value: '1024' },
    { key: 'topP', value: '1.0' },
    { key: 'frequencyPenalty', value: '0' },
    { key: 'presencePenalty', value: '0' }
  ];

  for (const config of aiConfigs) {
    await prisma.aIConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
  }

  console.log('Created AI config settings');

  // Create Knowledge Base documents
  const knowledgeDocs = [
    {
      title: 'What is MyPollingApp?',
      content: 'MyPollingApp is a voice-enabled polling application that allows users to create, share, and vote on polls. It features real-time results, AI-powered chat discussions, and multiple poll types including single choice, multiple choice, rating scales, NPS surveys, ranked choice voting, and open text responses.',
      type: 'text',
      enabled: true
    },
    {
      title: 'How to Create a Poll',
      content: 'To create a poll: 1) Go to the Admin panel, 2) Click "Create Poll", 3) Choose to start from scratch or use a template, 4) Select your poll type (single choice, multiple choice, rating, etc.), 5) Enter your question and options, 6) Configure any type-specific settings, 7) Click "Create Poll" to publish.',
      type: 'text',
      enabled: true
    },
    {
      title: 'Poll Types Explained',
      content: 'MyPollingApp supports 7 poll types: Single Choice (pick one option), Multiple Choice (pick several options), Yes/No (binary choice), Rating Scale (1-5 stars or numbers), NPS (0-10 Net Promoter Score), Ranked Choice (order preferences), and Open Text (free-form responses). Each type has unique configuration options.',
      type: 'text',
      enabled: true
    },
    {
      title: 'Voice Commands',
      content: 'MyPollingApp supports voice input for chat. Click the microphone button to speak your message. The AI will transcribe your speech and respond. Supported commands include asking about poll results, requesting explanations of voting options, and general questions about poll topics.',
      type: 'text',
      enabled: true
    },
    {
      title: 'Embedding Polls',
      content: 'Polls can be embedded on external websites using: 1) iFrame embed code, 2) JavaScript widget, 3) QR codes for mobile access. Visit the Test Embed page to generate embed codes. The embed supports light/dark themes, optional voting, and result display settings.',
      type: 'text',
      enabled: true
    },
    {
      title: 'Understanding NPS Scores',
      content: 'Net Promoter Score (NPS) measures customer loyalty on a 0-10 scale. Scores 0-6 are Detractors (unhappy), 7-8 are Passives (neutral), and 9-10 are Promoters (loyal fans). NPS = % Promoters - % Detractors. Scores range from -100 to +100, with above 0 being good and above 50 being excellent.',
      type: 'text',
      enabled: true
    },
    {
      title: 'Subscription Plans',
      content: 'MyPollingApp offers 4 subscription tiers: Free (1 poll, 50 responses), Starter ($9.99/mo - 5 polls, 500 responses), Professional ($29.99/mo - unlimited), and Enterprise ($99.99/mo - custom solutions). Higher tiers unlock features like voice chat, AI insights, custom branding, and API access.',
      type: 'text',
      enabled: true
    },
    {
      title: 'Analytics Dashboard',
      content: 'The Analytics Dashboard shows voting trends, poll performance, and engagement metrics. View charts for votes over time, response rates, and demographic breakdowns. Export data to CSV for further analysis. Available on Starter plan and above.',
      type: 'text',
      enabled: true
    }
  ];

  for (const doc of knowledgeDocs) {
    const existing = await prisma.knowledgeDocument.findFirst({ where: { title: doc.title } });
    if (!existing) {
      await prisma.knowledgeDocument.create({ data: doc });
    }
  }

  console.log('Created knowledge base documents:', knowledgeDocs.length);

  // Create AI Agents
  const aiAgents = [
    {
      name: 'poll_assistant',
      displayName: 'Poll Assistant',
      description: 'Helps users understand polls and voting options',
      systemPrompt: 'You are a helpful poll assistant. Help users understand the poll question, explain voting options, and provide context about the topic being polled. Be neutral and informative.',
      temperature: 0.7,
      enabled: true
    },
    {
      name: 'results_analyst',
      displayName: 'Results Analyst',
      description: 'Analyzes and explains poll results and trends',
      systemPrompt: 'You are a data analyst specializing in poll results. Explain voting patterns, calculate percentages, identify trends, and provide insights. Use clear language and avoid technical jargon.',
      temperature: 0.5,
      enabled: true
    },
    {
      name: 'survey_designer',
      displayName: 'Survey Designer',
      description: 'Helps create effective poll questions',
      systemPrompt: 'You are an expert in survey design. Help users craft unbiased, clear poll questions. Suggest answer options, recommend poll types, and advise on best practices for getting reliable feedback.',
      temperature: 0.8,
      enabled: true
    },
    {
      name: 'moderator',
      displayName: 'Discussion Moderator',
      description: 'Facilitates balanced discussions about poll topics',
      systemPrompt: 'You are a discussion moderator. Facilitate balanced conversations about poll topics. Present multiple perspectives, encourage respectful dialogue, and keep discussions on-topic.',
      temperature: 0.6,
      enabled: true
    }
  ];

  for (const agent of aiAgents) {
    await prisma.aIAgent.upsert({
      where: { name: agent.name },
      update: agent,
      create: agent
    });
  }

  console.log('Created AI agents:', aiAgents.map(a => a.displayName));

  // Create Logic Rules
  const logicRules = [
    {
      name: 'Greeting Response',
      description: 'Respond to user greetings warmly',
      trigger: 'message_contains',
      condition: 'hello,hi,hey,greetings',
      action: 'prepend_context',
      actionData: JSON.stringify({ context: 'The user is greeting you. Respond warmly and ask how you can help with the poll.' }),
      priority: 10,
      enabled: true
    },
    {
      name: 'Results Request',
      description: 'Handle requests for poll results',
      trigger: 'message_contains',
      condition: 'results,winning,leading,votes,statistics',
      action: 'use_tool',
      actionData: JSON.stringify({ tool: 'poll_results' }),
      priority: 20,
      enabled: true
    },
    {
      name: 'Help Request',
      description: 'Provide help when users ask for it',
      trigger: 'message_contains',
      condition: 'help,how do i,how to,explain,what is',
      action: 'switch_agent',
      actionData: JSON.stringify({ agent: 'poll_assistant' }),
      priority: 15,
      enabled: true
    },
    {
      name: 'Off-Topic Redirect',
      description: 'Redirect off-topic conversations back to the poll',
      trigger: 'sentiment',
      condition: 'off_topic',
      action: 'prepend_context',
      actionData: JSON.stringify({ context: 'The user may be going off-topic. Gently redirect them back to discussing the poll while still being helpful.' }),
      priority: 5,
      enabled: true
    },
    {
      name: 'Negative Sentiment Handler',
      description: 'Handle negative or frustrated users',
      trigger: 'sentiment',
      condition: 'negative',
      action: 'prepend_context',
      actionData: JSON.stringify({ context: 'The user seems frustrated. Be extra patient and helpful. Acknowledge their concerns before providing assistance.' }),
      priority: 25,
      enabled: true
    }
  ];

  for (const rule of logicRules) {
    const existing = await prisma.logicRule.findFirst({ where: { name: rule.name } });
    if (!existing) {
      await prisma.logicRule.create({ data: rule });
    }
  }

  console.log('Created logic rules:', logicRules.map(r => r.name));

  // Create Custom Functions
  const customFunctions = [
    {
      name: 'get_poll_stats',
      displayName: 'Get Poll Statistics',
      description: 'Retrieves current poll statistics including vote counts and percentages',
      code: `async function getPollStats(pollId) {
  const response = await fetch(\`/api/polls/\${pollId}\`);
  const poll = await response.json();
  return {
    title: poll.title,
    totalVotes: poll.totalVotes,
    options: poll.options.map(o => ({
      label: o.label || o.text,
      votes: o.votes,
      percentage: poll.totalVotes > 0 ? Math.round((o.votes / poll.totalVotes) * 100) : 0
    }))
  };
}`,
      parameters: JSON.stringify({ pollId: { type: 'string', description: 'The poll ID to get stats for' } }),
      enabled: true
    },
    {
      name: 'format_results',
      displayName: 'Format Results',
      description: 'Formats poll results as a readable string',
      code: `function formatResults(options) {
  return options
    .sort((a, b) => b.votes - a.votes)
    .map((o, i) => \`\${i + 1}. \${o.label}: \${o.percentage}% (\${o.votes} votes)\`)
    .join('\\n');
}`,
      parameters: JSON.stringify({ options: { type: 'array', description: 'Array of poll options with votes' } }),
      enabled: true
    },
    {
      name: 'calculate_nps',
      displayName: 'Calculate NPS Score',
      description: 'Calculates Net Promoter Score from ratings',
      code: `function calculateNPS(ratings) {
  if (!ratings || ratings.length === 0) return null;
  const detractors = ratings.filter(r => r <= 6).length;
  const promoters = ratings.filter(r => r >= 9).length;
  return Math.round(((promoters - detractors) / ratings.length) * 100);
}`,
      parameters: JSON.stringify({ ratings: { type: 'array', description: 'Array of NPS ratings (0-10)' } }),
      enabled: true
    },
    {
      name: 'validate_vote',
      displayName: 'Validate Vote',
      description: 'Validates if a vote is allowed based on poll settings',
      code: `function validateVote(poll, visitorId, selectedOptions) {
  if (poll.status !== 'open') return { valid: false, error: 'Poll is closed' };
  if (!selectedOptions || selectedOptions.length === 0) return { valid: false, error: 'No option selected' };
  const config = poll.config || {};
  if (config.maxSelections && selectedOptions.length > config.maxSelections) {
    return { valid: false, error: \`Maximum \${config.maxSelections} selections allowed\` };
  }
  return { valid: true };
}`,
      parameters: JSON.stringify({
        poll: { type: 'object', description: 'The poll object' },
        visitorId: { type: 'string', description: 'Visitor identifier' },
        selectedOptions: { type: 'array', description: 'Selected option IDs' }
      }),
      enabled: true
    }
  ];

  for (const func of customFunctions) {
    await prisma.customFunction.upsert({
      where: { name: func.name },
      update: func,
      create: func
    });
  }

  console.log('Created custom functions:', customFunctions.map(f => f.displayName));

  // Create Webhooks
  const webhooks = [
    {
      name: 'Vote Notification',
      url: 'https://example.com/webhooks/vote',
      events: ['vote.created'],
      secret: 'webhook_secret_vote_123',
      enabled: false
    },
    {
      name: 'Poll Created',
      url: 'https://example.com/webhooks/poll-created',
      events: ['poll.created'],
      secret: 'webhook_secret_poll_456',
      enabled: false
    },
    {
      name: 'Poll Closed',
      url: 'https://example.com/webhooks/poll-closed',
      events: ['poll.closed'],
      secret: 'webhook_secret_close_789',
      enabled: false
    },
    {
      name: 'Milestone Reached',
      url: 'https://example.com/webhooks/milestone',
      events: ['vote.milestone'],
      secret: 'webhook_secret_milestone_012',
      enabled: false
    },
    {
      name: 'Slack Notification',
      url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      events: ['poll.created', 'poll.closed', 'vote.milestone'],
      secret: null,
      enabled: false
    }
  ];

  for (const webhook of webhooks) {
    const existing = await prisma.webhook.findFirst({ where: { name: webhook.name } });
    if (!existing) {
      await prisma.webhook.create({ data: webhook });
    }
  }

  console.log('Created webhooks:', webhooks.map(w => w.name));

  // Create Payment Gateways
  const paymentGateways = [
    {
      provider: 'stripe',
      isEnabled: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY',
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY',
      testMode: true,
      achEnabled: false
    },
    {
      provider: 'paypal',
      isEnabled: false,
      publishableKey: process.env.PAYPAL_CLIENT_ID || '',
      secretKey: process.env.PAYPAL_CLIENT_SECRET || '',
      testMode: true,
      achEnabled: false
    },
    {
      provider: 'braintree',
      isEnabled: false,
      publishableKey: process.env.BRAINTREE_MERCHANT_ID || '',
      secretKey: process.env.BRAINTREE_PRIVATE_KEY || '',
      merchantId: process.env.BRAINTREE_MERCHANT_ID || '',
      testMode: true,
      achEnabled: false
    },
    {
      provider: 'square',
      isEnabled: false,
      publishableKey: process.env.SQUARE_APPLICATION_ID || '',
      secretKey: process.env.SQUARE_ACCESS_TOKEN || '',
      testMode: true,
      achEnabled: false
    },
    {
      provider: 'authorize',
      isEnabled: false,
      publishableKey: process.env.AUTHORIZE_API_LOGIN_ID || '',
      secretKey: process.env.AUTHORIZE_TRANSACTION_KEY || '',
      testMode: true,
      achEnabled: false
    }
  ];

  for (const gateway of paymentGateways) {
    await prisma.paymentGateway.upsert({
      where: { provider: gateway.provider },
      update: {
        isEnabled: gateway.isEnabled,
        testMode: gateway.testMode,
        achEnabled: gateway.achEnabled,
        ...(gateway.publishableKey && { publishableKey: gateway.publishableKey }),
        ...(gateway.secretKey && { secretKey: gateway.secretKey }),
        ...(gateway.merchantId && { merchantId: gateway.merchantId })
      },
      create: gateway
    });
  }

  console.log('Created payment gateways:', paymentGateways.map(g => g.provider));

  // Create sample trial codes
  const trialCodes = [
    {
      code: 'TRIAL14FREE',
      email: null,
      phone: null,
      status: 'PENDING',
      trialDays: 14,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    {
      code: 'WELCOME30',
      email: null,
      phone: null,
      status: 'PENDING',
      trialDays: 30,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
    },
    {
      code: 'STARTER7DAY',
      email: null,
      phone: null,
      status: 'PENDING',
      trialDays: 7,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    }
  ];

  for (const trialCode of trialCodes) {
    const existing = await prisma.trialCode.findFirst({ where: { code: trialCode.code } });
    if (!existing) {
      await prisma.trialCode.create({ data: trialCode });
    }
  }

  console.log('Created trial codes:', trialCodes.map(t => t.code));

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
