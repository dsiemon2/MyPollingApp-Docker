import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma, getSetting } from '@/lib/prisma';
import { canUseAiInsights, canUseAdvancedAi, PlanType } from '@/config/plans';
import logger from '@/utils/logger';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface WizardState {
  type: string;
  currentStep: number;
  totalSteps: number;
  data: Record<string, any>;
  options?: { label: string; value: string | number }[];
  canSkip?: boolean;
}

interface VisualAid {
  type: 'stepCard' | 'statsCard' | 'rankingCard' | 'pollCard';
  content: any;
}

interface SuggestedAction {
  label: string;
  prompt: string;
}

// Intent patterns for polling operations
const intentPatterns = {
  createPoll: /\b(create|make|new|start|add)\b.*\b(poll|survey|vote|question)/i,
  listPolls: /\b(show|list|display|get|view|see)\b.*\b(polls?|surveys?|all)/i,
  activePolls: /\b(active|open|current|running)\b.*\b(polls?|surveys?)/i,
  closedPolls: /\b(closed|ended|finished|completed|past)\b.*\b(polls?|surveys?)/i,
  pollResults: /\b(results?|analytics?|stats?|data|insights?|votes?)\b/i,
  deletePoll: /\b(delete|remove|close)\b.*\b(poll|survey)/i,
  editPoll: /\b(edit|update|modify|change)\b.*\b(poll|survey)/i,
  help: /\b(help|what can you do|commands?|options?)\b/i,
  greeting: /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i,
};

// Build context about polls for the AI
async function buildPollContext(): Promise<string> {
  try {
    const [polls, pollTypes, recentVotes] = await Promise.all([
      prisma.poll.findMany({
        where: { status: 'open' },
        include: {
          options: true,
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.pollType.findMany({
        where: { isActive: true },
        select: { code: true, name: true, description: true },
      }),
      prisma.vote.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const totalPolls = await prisma.poll.count();
    const totalVotes = await prisma.vote.count();

    let context = `\n\nCURRENT POLLING DATA:\n`;
    context += `- Total polls: ${totalPolls}\n`;
    context += `- Total votes: ${totalVotes}\n`;
    context += `- Votes in last 24 hours: ${recentVotes}\n`;
    context += `- Active polls: ${polls.length}\n\n`;

    if (polls.length > 0) {
      context += `ACTIVE POLLS:\n`;
      polls.forEach((poll, i) => {
        context += `${i + 1}. "${poll.title}" - ${poll._count.votes} votes\n`;
        if (poll.options.length > 0) {
          poll.options.forEach((opt) => {
            context += `   - ${opt.label}\n`;
          });
        }
      });
    }

    context += `\nAVAILABLE POLL TYPES:\n`;
    pollTypes.forEach((type) => {
      context += `- ${type.name} (${type.code}): ${type.description || 'No description'}\n`;
    });

    return context;
  } catch (error) {
    logger.error({ error }, 'Error building poll context');
    return '';
  }
}

// Generate visual aids based on intent
async function generateVisualAids(intent: string): Promise<VisualAid[]> {
  const aids: VisualAid[] = [];

  try {
    if (intent === 'pollResults' || intent === 'listPolls' || intent === 'activePolls') {
      const polls = await prisma.poll.findMany({
        where: { status: 'open' },
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (polls.length > 0) {
        // Stats card
        const totalVotes = polls.reduce((sum, p) => sum + p._count.votes, 0);
        aids.push({
          type: 'statsCard',
          content: {
            stats: [
              { label: 'Active Polls', value: polls.length },
              { label: 'Total Votes', value: totalVotes },
            ],
          },
        });

        // Poll cards
        polls.slice(0, 2).forEach((poll) => {
          const totalVotes = poll._count.votes;
          aids.push({
            type: 'pollCard',
            content: {
              title: poll.title,
              options: poll.options.map((opt) => ({
                label: opt.label,
                votes: opt._count.votes,
                percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0,
              })),
            },
          });
        });
      }
    }

    if (intent === 'createPoll') {
      aids.push({
        type: 'stepCard',
        content: {
          steps: [
            { number: 1, title: 'Choose poll type', content: 'Single choice, multiple choice, rating, etc.' },
            { number: 2, title: 'Enter question', content: 'The main question for your poll' },
            { number: 3, title: 'Add options', content: 'The choices voters can select' },
            { number: 4, title: 'Configure settings', content: 'Optional: voting limits, end date' },
          ],
        },
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error generating visual aids');
  }

  return aids;
}

// Generate suggested actions based on context
function generateSuggestedActions(intent: string): SuggestedAction[] {
  switch (intent) {
    case 'createPoll':
      return [
        { label: 'Single Choice Poll', prompt: 'Create a single choice poll' },
        { label: 'Multiple Choice', prompt: 'Create a multiple choice poll' },
        { label: 'Rating Scale', prompt: 'Create a rating scale poll' },
      ];
    case 'listPolls':
    case 'activePolls':
      return [
        { label: 'View Results', prompt: 'Show me poll results' },
        { label: 'Create New Poll', prompt: 'Create a new poll' },
        { label: 'Close a Poll', prompt: 'How do I close a poll?' },
      ];
    case 'pollResults':
      return [
        { label: 'Export Data', prompt: 'How can I export poll data?' },
        { label: 'Share Results', prompt: 'How do I share poll results?' },
        { label: 'Analytics', prompt: 'Show me analytics dashboard' },
      ];
    default:
      return [
        { label: 'Create Poll', prompt: 'Help me create a new poll' },
        { label: 'Active Polls', prompt: 'Show me all active polls' },
        { label: 'View Results', prompt: 'Show poll results and analytics' },
      ];
  }
}

// Detect user intent from message
function detectIntent(message: string): string | null {
  for (const [intent, pattern] of Object.entries(intentPatterns)) {
    if (pattern.test(message)) {
      return intent;
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check user's subscription
    const session = await getServerSession(req, res, authOptions);
    let userPlan: PlanType = 'FREE';
    let userId: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true },
      });
      userPlan = (user?.subscription?.plan as PlanType) || 'FREE';
      userId = user?.id || null;
    }

    // Check if user can use AI features
    if (!canUseAiInsights(userPlan)) {
      return res.status(403).json({
        error: 'AI assistant requires a Starter plan or higher. Please upgrade to access this feature.',
        code: 'AI_INSIGHTS_NOT_ALLOWED',
      });
    }

    const { message, wizardState, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get business name for personalization
    const businessName = await getSetting('businessName');

    // Detect user intent
    const intent = detectIntent(message);

    // Build poll context
    const pollContext = await buildPollContext();

    // Generate visual aids based on intent
    const visualAids = intent ? await generateVisualAids(intent) : [];

    // Generate suggested actions
    const suggestedActions = generateSuggestedActions(intent || 'default');

    // Check if OpenAI is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!openaiKey || openaiKey === 'sk-your-openai-key') {
      // Fallback to rule-based responses
      return res.json({
        message: generateFallbackResponse(message, intent, pollContext),
        isAiPowered: false,
        visualAids,
        suggestedActions,
      });
    }

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for ${businessName || 'MyPollingApp'}, a polling and survey application.

Your role is to help users:
- Create and manage polls
- Understand poll results and analytics
- Answer questions about the polling platform
- Provide insights from voting data

Guidelines:
- Be concise and friendly
- Use markdown formatting for lists and emphasis
- When showing poll data, be specific with numbers
- Suggest relevant actions the user can take
- If asked to create a poll, explain the steps or ask clarifying questions

${pollContext}`;

    // Build messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history for context
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-8).forEach((msg: ChatMessage) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: openaiModel,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      logger.error({ status: openaiResponse.status, error: errorData }, 'OpenAI API error');

      // Fallback to rule-based response
      return res.json({
        message: generateFallbackResponse(message, intent, pollContext),
        isAiPowered: false,
        visualAids,
        suggestedActions,
      });
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return res.json({
      message: aiResponse,
      isAiPowered: true,
      visualAids,
      suggestedActions,
      model: openaiModel,
    });

  } catch (error: any) {
    logger.error({ error: error.message }, 'AI Assistant chat error');
    return res.status(500).json({ error: 'Failed to process message' });
  }
}

// Fallback responses when OpenAI is not available
function generateFallbackResponse(message: string, intent: string | null, context: string): string {
  const lowerMessage = message.toLowerCase();

  if (intent === 'greeting') {
    return "Hello! I'm your polling assistant. I can help you create polls, view results, and manage your surveys. What would you like to do today?";
  }

  if (intent === 'help') {
    return `I can help you with:

**Creating Polls**
- Create single choice, multiple choice, or rating polls
- Set up advanced poll types like NPS or ranked choice

**Managing Polls**
- View all your active polls
- Close or delete polls
- Edit poll options

**Analytics**
- View voting results
- See participation trends
- Export poll data

What would you like to do?`;
  }

  if (intent === 'createPoll') {
    return `To create a new poll, you can:

1. Go to the **Admin Panel** > **Polls** > **Create Poll**
2. Choose your poll type (single choice, multiple choice, etc.)
3. Enter your question and options
4. Configure settings like voting limits

Would you like me to explain any specific poll type?`;
  }

  if (intent === 'listPolls' || intent === 'activePolls') {
    // Extract poll count from context
    const match = context.match(/Active polls: (\d+)/);
    const count = match ? match[1] : 'several';

    return `You currently have **${count}** active polls. You can view them all in the Admin Panel under "Polls".

Would you like to see the results for a specific poll or create a new one?`;
  }

  if (intent === 'pollResults') {
    return `To view poll results:

1. Go to **Admin Panel** > **Polls**
2. Click on any poll to see its results
3. Use the **Analytics** page for detailed insights

You can also export results as CSV for further analysis.`;
  }

  // Default response
  return `I understand you're asking about "${message}". While I'm operating in basic mode, I can still help you with:

- **Creating polls** - Say "create a poll"
- **Viewing polls** - Say "show active polls"
- **Results** - Say "show results"

How can I assist you?`;
}
