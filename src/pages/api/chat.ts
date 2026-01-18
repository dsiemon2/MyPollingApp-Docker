import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { HfInference } from '@huggingface/inference';
import { prisma, getSetting } from '@/lib/prisma';
import { canUseAiInsights, canUseAdvancedAi, PlanType } from '@/config/plans';
import { onAIResponse } from '@/services/webhooks';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check user's subscription for AI insights feature
    const session = await getServerSession(req, res, authOptions);
    let userPlan: PlanType = 'FREE';

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true }
      });
      userPlan = (user?.subscription?.plan as PlanType) || 'FREE';
    }

    if (!canUseAiInsights(userPlan)) {
      return res.status(403).json({
        error: 'AI insights require a Starter plan or higher. Please upgrade to access this feature.',
        code: 'AI_INSIGHTS_NOT_ALLOWED'
      });
    }

    const { message, context, agentId } = req.body;
    const useAdvancedAi = canUseAdvancedAi(userPlan);
    const businessName = await getSetting('businessName');

    // Get agent settings if specified
    let agentSystemPrompt = `You are a helpful AI assistant for a polling application called ${businessName}.
You help users understand polls, discuss topics, and provide thoughtful insights.
Keep responses concise and friendly. If asked about poll results, use the context provided.`;
    let agentTemperature = 0.7;
    let agentName = 'Default Assistant';

    if (agentId) {
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId }
      });
      if (agent && agent.enabled) {
        agentSystemPrompt = agent.systemPrompt || agentSystemPrompt;
        agentTemperature = agent.temperature;
        agentName = agent.displayName;
      }
    }

    const prompt = context
      ? `${agentSystemPrompt}\n\nPoll Context: ${context}\n\nUser: ${message}\n\nAssistant:`
      : `${agentSystemPrompt}\n\nUser: ${message}\n\nAssistant:`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 256,
        temperature: agentTemperature,
        top_p: 0.95,
        repetition_penalty: 1.1,
        do_sample: true
      }
    });

    // Extract the assistant's response
    let aiResponse = response.generated_text;
    if (aiResponse.includes('Assistant:')) {
      aiResponse = aiResponse.split('Assistant:').pop()?.trim() || aiResponse;
    }

    // Clean up any trailing incomplete sentences
    const lastPeriod = aiResponse.lastIndexOf('.');
    const lastQuestion = aiResponse.lastIndexOf('?');
    const lastExclaim = aiResponse.lastIndexOf('!');
    const lastEnd = Math.max(lastPeriod, lastQuestion, lastExclaim);

    if (lastEnd > 0 && lastEnd < aiResponse.length - 1) {
      aiResponse = aiResponse.substring(0, lastEnd + 1);
    }

    // Emit webhook event for AI response
    const { pollId } = req.body;
    if (pollId) {
      onAIResponse({
        pollId,
        response: aiResponse,
        model: 'mistralai/Mistral-7B-Instruct-v0.2'
      }).catch(err => console.error('Webhook error:', err));
    }

    return res.json({ response: aiResponse, agentName });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
