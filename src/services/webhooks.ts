import { prisma } from '@/lib/prisma';

export type WebhookEvent =
  | 'poll.created'
  | 'poll.closed'
  | 'poll.deleted'
  | 'vote.cast'
  | 'chat.message'
  | 'voice.transcribed'
  | 'ai.response';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

interface WebhookResult {
  webhookId: string;
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
}

export async function emitWebhookEvent(
  event: WebhookEvent,
  data: Record<string, any>
): Promise<WebhookResult[]> {
  const results: WebhookResult[] = [];

  try {
    // Find all enabled webhooks that listen for this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        enabled: true,
        events: {
          has: event
        }
      }
    });

    if (webhooks.length === 0) {
      return results;
    }

    // Prepare the payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    // Fire webhooks in parallel
    const promises = webhooks.map(async (webhook) => {
      const startTime = Date.now();
      let result: WebhookResult = {
        webhookId: webhook.id,
        url: webhook.url,
        success: false,
        duration: 0
      };

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Timestamp': payload.timestamp
        };

        // Add secret header if configured
        if (webhook.secret) {
          const crypto = await import('crypto');
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');
          headers['X-Webhook-Signature'] = signature;
        }

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        result.success = response.ok;
        result.statusCode = response.status;
        result.duration = Date.now() - startTime;

        // Log the webhook call
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            statusCode: response.status,
            success: response.ok,
            response: response.ok ? null : await response.text().catch(() => null)
          }
        });

      } catch (error: any) {
        result.error = error.message;
        result.duration = Date.now() - startTime;

        // Log failed webhook
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            statusCode: 0,
            success: false,
            response: error.message
          }
        }).catch(() => {}); // Ignore logging errors
      }

      return result;
    });

    const settledResults = await Promise.all(promises);
    results.push(...settledResults);

  } catch (error) {
    console.error('Error emitting webhook event:', error);
  }

  return results;
}

// Convenience functions for common events
export async function onPollCreated(poll: { id: string; title: string; type: string; creatorId: string }) {
  return emitWebhookEvent('poll.created', {
    pollId: poll.id,
    title: poll.title,
    type: poll.type,
    creatorId: poll.creatorId
  });
}

export async function onPollClosed(poll: { id: string; title: string; totalVotes: number }) {
  return emitWebhookEvent('poll.closed', {
    pollId: poll.id,
    title: poll.title,
    totalVotes: poll.totalVotes
  });
}

export async function onVoteCast(vote: { pollId: string; optionId?: string; value?: string }) {
  return emitWebhookEvent('vote.cast', {
    pollId: vote.pollId,
    optionId: vote.optionId,
    value: vote.value
  });
}

export async function onChatMessage(message: { pollId: string; content: string; role: string }) {
  return emitWebhookEvent('chat.message', {
    pollId: message.pollId,
    content: message.content,
    role: message.role
  });
}

export async function onVoiceTranscribed(data: { pollId: string; text: string }) {
  return emitWebhookEvent('voice.transcribed', data);
}

export async function onAIResponse(data: { pollId: string; response: string; model: string }) {
  return emitWebhookEvent('ai.response', data);
}
