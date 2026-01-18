import { prisma } from '@/lib/prisma';
import { emitWebhookEvent, WebhookEvent } from './webhooks';
import * as vm from 'vm';

// Trigger types that logic rules can respond to
export type RuleTrigger =
  | 'poll.created'
  | 'poll.closed'
  | 'vote.cast'
  | 'chat.message'
  | 'session.start'
  | 'high.volume';

// Action types that rules can execute
export type RuleAction =
  | 'send_message'
  | 'trigger_webhook'
  | 'notify_admin'
  | 'log_event';

interface RuleContext {
  poll?: {
    id: string;
    title: string;
    type: string;
    totalVotes?: number;
  };
  vote?: {
    optionId?: string;
    value?: string;
    rating?: number;
  };
  message?: {
    content: string;
    role: string;
  };
  user?: {
    id?: string;
    email?: string;
  };
}

interface RuleResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  action?: RuleAction;
  result?: any;
  error?: string;
}

/**
 * Evaluate a condition string safely
 * Returns true if condition passes, false otherwise
 */
function evaluateCondition(condition: string | null, context: RuleContext): boolean {
  if (!condition || condition.trim() === '') {
    return true; // No condition means always trigger
  }

  try {
    // Create a sandboxed context with limited access
    const sandbox = {
      poll: context.poll || {},
      vote: context.vote || {},
      message: context.message || {},
      user: context.user || {},
      // Safe built-ins only
      Math,
      String,
      Number,
      Boolean,
      Array,
      Object,
      JSON,
      Date,
      // Result placeholder
      result: false
    };

    // Wrap condition in result assignment
    const wrappedCode = `result = Boolean(${condition})`;

    const vmContext = vm.createContext(sandbox);
    vm.runInContext(wrappedCode, vmContext, { timeout: 100 });

    return sandbox.result === true;
  } catch (error) {
    console.error('Error evaluating rule condition:', error);
    return false;
  }
}

/**
 * Execute an action based on the rule configuration
 */
async function executeAction(
  action: RuleAction,
  actionData: string | null,
  context: RuleContext
): Promise<any> {
  const data = actionData ? JSON.parse(actionData) : {};

  switch (action) {
    case 'send_message':
      // Store a system message in the poll chat
      if (context.poll?.id && data.message) {
        const message = await prisma.chatMessage.create({
          data: {
            pollId: context.poll.id,
            content: data.message,
            role: 'system',
            username: 'System'
          }
        });
        return { messageId: message.id };
      }
      break;

    case 'trigger_webhook':
      // Trigger a custom webhook
      if (data.webhookEvent && data.webhookData) {
        const results = await emitWebhookEvent(
          data.webhookEvent as WebhookEvent,
          { ...data.webhookData, ...context }
        );
        return { webhookResults: results };
      }
      break;

    case 'notify_admin':
      // Log admin notification (could be extended to send email)
      console.log(`[ADMIN NOTIFICATION] ${data.message || 'Rule triggered'}`, context);
      return { notified: true };

    case 'log_event':
      // Log the event
      console.log(`[RULE LOG] ${data.message || 'Event logged'}`, context);
      return { logged: true };

    default:
      console.warn(`Unknown action type: ${action}`);
  }

  return null;
}

/**
 * Evaluate all rules for a given trigger and context
 */
export async function evaluateRules(
  trigger: RuleTrigger,
  context: RuleContext
): Promise<RuleResult[]> {
  const results: RuleResult[] = [];

  try {
    // Find all enabled rules for this trigger, ordered by priority
    const rules = await prisma.logicRule.findMany({
      where: {
        trigger,
        enabled: true
      },
      orderBy: { priority: 'desc' }
    });

    if (rules.length === 0) {
      return results;
    }

    // Evaluate each rule
    for (const rule of rules) {
      const result: RuleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false
      };

      try {
        // Check if condition passes
        const conditionMet = evaluateCondition(rule.condition, context);

        if (conditionMet) {
          result.triggered = true;
          result.action = rule.action as RuleAction;

          // Execute the action
          const actionResult = await executeAction(
            rule.action as RuleAction,
            rule.actionData,
            context
          );
          result.result = actionResult;
        }
      } catch (error: any) {
        result.error = error.message;
      }

      results.push(result);
    }
  } catch (error) {
    console.error('Error evaluating rules:', error);
  }

  return results;
}

// Convenience functions for common triggers
export async function onPollCreatedRule(poll: { id: string; title: string; type: string }) {
  return evaluateRules('poll.created', { poll });
}

export async function onPollClosedRule(poll: { id: string; title: string; totalVotes: number }) {
  return evaluateRules('poll.closed', { poll: { ...poll, type: '' } });
}

export async function onVoteCastRule(poll: { id: string; title: string }, vote: { optionId?: string; value?: string; rating?: number }) {
  return evaluateRules('vote.cast', { poll: { ...poll, type: '' }, vote });
}

export async function onChatMessageRule(poll: { id: string; title: string }, message: { content: string; role: string }) {
  return evaluateRules('chat.message', { poll: { ...poll, type: '' }, message });
}
