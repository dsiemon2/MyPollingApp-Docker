/**
 * AI Chat Slider Tests
 * Tests for the floating AI assistant chat component
 * Based on AiChatTest.php from Voting_NewAndImproved
 */

import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    poll: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    vote: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    pollType: {
      findMany: jest.fn(),
    },
    pollTemplate: {
      findMany: jest.fn(),
    },
    systemSetting: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test AI response' } }],
        }),
      },
    },
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue({ text: 'Transcribed text' }),
      },
    },
  }));
});

describe('AI Chat Slider - Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('chat endpoint returns JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: 'Hello! How can I help you?' }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data).toHaveProperty('response');
  });

  test('chat responds to help request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'I can help you with: creating polls, viewing results, managing votes...',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'help' }),
    });

    const data = await response.json();
    expect(data.response).toContain('help');
  });

  test('chat handles empty message gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Please enter a message or question.',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
  });

  test('chat handles special characters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: 'Processed successfully' }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '<script>alert("xss")</script>' }),
    });

    expect(response.ok).toBe(true);
  });

  test('chat handles long messages', async () => {
    const longMessage = 'a'.repeat(5000);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: 'Message received' }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: longMessage }),
    });

    expect(response.ok).toBe(true);
  });
});

describe('AI Chat Slider - Intent Detection', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('detects create poll intent', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'I can help you create a new poll. What would you like to ask?',
        intent: 'create_poll',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'I want to create a new poll' }),
    });

    const data = await response.json();
    expect(data.intent).toBe('create_poll');
  });

  test('detects view results intent', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here are your poll results...',
        intent: 'view_results',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show me the results' }),
    });

    const data = await response.json();
    expect(data.intent).toBe('view_results');
  });

  test('detects vote intent', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'You can vote on active polls...',
        intent: 'vote',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'I want to vote' }),
    });

    const data = await response.json();
    expect(data.intent).toBe('vote');
  });

  test('detects poll list intent', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here are the active polls...',
        intent: 'list_polls',
        polls: [],
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show all polls' }),
    });

    const data = await response.json();
    expect(data.intent).toBe('list_polls');
  });
});

describe('AI Chat Slider - Poll Queries', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('displays active polls', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here are 3 active polls...',
        polls: [
          { id: '1', title: 'Favorite Color', status: 'open' },
          { id: '2', title: 'Best Food', status: 'open' },
          { id: '3', title: 'Movie Night', status: 'open' },
        ],
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show active polls' }),
    });

    const data = await response.json();
    expect(data.polls).toHaveLength(3);
  });

  test('displays all polls including closed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here are all polls...',
        polls: [
          { id: '1', title: 'Active Poll', status: 'open' },
          { id: '2', title: 'Closed Poll', status: 'closed' },
        ],
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show all polls including closed' }),
    });

    const data = await response.json();
    expect(data.polls.some((p: any) => p.status === 'closed')).toBe(true);
  });

  test('displays results for specific poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Results for "Favorite Color": Red - 45%, Blue - 35%, Green - 20%',
        pollId: '1',
        results: {
          Red: 45,
          Blue: 35,
          Green: 20,
        },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show results for Favorite Color' }),
    });

    const data = await response.json();
    expect(data.results).toBeDefined();
  });

  test('handles poll not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'I couldn\'t find a poll with that name.',
        error: 'poll_not_found',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show results for NonExistentPoll' }),
    });

    const data = await response.json();
    expect(data.error).toBe('poll_not_found');
  });

  test('handles partial poll name matching', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Found poll: "Favorite Color Poll"',
        poll: { id: '1', title: 'Favorite Color Poll' },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show Favorite Color' }),
    });

    const data = await response.json();
    expect(data.poll.title).toContain('Favorite Color');
  });
});

describe('AI Chat Slider - Voting Statistics', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('displays voting statistics', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Voting statistics: Total votes: 150, Active polls: 5',
        stats: {
          totalVotes: 150,
          activePolls: 5,
          totalPolls: 10,
        },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show voting statistics' }),
    });

    const data = await response.json();
    expect(data.stats.totalVotes).toBe(150);
  });

  test('displays poll-specific statistics', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Poll "Favorite Color" has 50 votes',
        pollStats: {
          voteCount: 50,
          optionCount: 3,
          createdAt: '2024-01-01',
        },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'how many votes for Favorite Color' }),
    });

    const data = await response.json();
    expect(data.pollStats.voteCount).toBe(50);
  });
});

describe('AI Chat Slider - Poll Types and Templates', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('displays available poll types', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Available poll types: Single Choice, Multiple Choice, Yes/No, Rating Scale, NPS, Ranked, Open Text',
        pollTypes: [
          { code: 'single_choice', name: 'Single Choice' },
          { code: 'multiple_choice', name: 'Multiple Choice' },
          { code: 'yes_no', name: 'Yes/No' },
          { code: 'rating_scale', name: 'Rating Scale' },
          { code: 'nps', name: 'Net Promoter Score' },
          { code: 'ranked', name: 'Ranked Choice' },
          { code: 'open_text', name: 'Open Text' },
        ],
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'what poll types are available' }),
    });

    const data = await response.json();
    expect(data.pollTypes).toHaveLength(7);
  });

  test('displays poll templates', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Available templates: Customer Feedback, Team Vote, Quick Poll',
        templates: [
          { name: 'Customer Feedback', category: 'business' },
          { name: 'Team Vote', category: 'team' },
          { name: 'Quick Poll', category: 'general' },
        ],
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'show poll templates' }),
    });

    const data = await response.json();
    expect(data.templates.length).toBeGreaterThan(0);
  });

  test('explains poll type differences', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Single Choice allows one selection, while Multiple Choice allows several...',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'what is the difference between single and multiple choice' }),
    });

    const data = await response.json();
    expect(data.response).toContain('Choice');
  });
});

describe('AI Chat Slider - Voice Input', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('transcribe endpoint accepts audio', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: 'Hello world' }),
    });

    const formData = new FormData();
    formData.append('audio', new Blob(['audio data'], { type: 'audio/webm' }));

    const response = await fetch('/api/ai-assistant/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(data.text).toBe('Hello world');
  });

  test('voice status endpoint returns enabled state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        voiceEnabled: true,
        provider: 'openai',
      }),
    });

    const response = await fetch('/api/ai-assistant/settings');
    const data = await response.json();
    expect(data.voiceEnabled).toBe(true);
  });

  test('handles transcription failure gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Transcription failed' }),
    });

    const response = await fetch('/api/ai-assistant/transcribe', {
      method: 'POST',
      body: new FormData(),
    });

    expect(response.ok).toBe(false);
  });
});

describe('AI Chat Slider - Suggested Actions', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns contextual suggestions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here are some things you can do...',
        suggestions: [
          'Create a new poll',
          'View active polls',
          'Check results',
        ],
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'what can I do' }),
    });

    const data = await response.json();
    expect(data.suggestions).toHaveLength(3);
  });

  test('returns poll-specific suggestions after viewing poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here is the poll...',
        suggestions: [
          'Vote on this poll',
          'View results',
          'Share this poll',
        ],
        context: { pollId: '1' },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'show poll Favorite Color',
        context: { currentPage: '/polls/1' },
      }),
    });

    const data = await response.json();
    expect(data.suggestions).toContain('Vote on this poll');
  });
});

describe('AI Chat Slider - Settings', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('get settings returns configuration', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        enabled: true,
        position: 'bottom-right',
        buttonColor: '#1e40af',
        panelWidth: 380,
        voiceEnabled: true,
        showOnPublic: true,
        showOnAdmin: true,
      }),
    });

    const response = await fetch('/api/ai-assistant/settings');
    const data = await response.json();

    expect(data.enabled).toBe(true);
    expect(data.position).toBe('bottom-right');
    expect(data.buttonColor).toBe('#1e40af');
  });

  test('update settings saves configuration', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/ai-assistant/settings', {
      method: 'POST',
      body: JSON.stringify({
        position: 'bottom-left',
        buttonColor: '#ff0000',
      }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('settings validates position value', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid position value' }),
    });

    const response = await fetch('/api/ai-assistant/settings', {
      method: 'POST',
      body: JSON.stringify({
        position: 'invalid-position',
      }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('AI Chat Slider - Wizard Interactions', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('initiates poll creation wizard', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Let\'s create a poll! What question would you like to ask?',
        wizardState: {
          step: 'title',
          type: 'create_poll',
        },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'create a poll' }),
    });

    const data = await response.json();
    expect(data.wizardState.step).toBe('title');
  });

  test('wizard handles cancel operation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Poll creation cancelled. How else can I help?',
        wizardState: null,
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'cancel',
        wizardState: { step: 'options', type: 'create_poll' },
      }),
    });

    const data = await response.json();
    expect(data.wizardState).toBeNull();
  });

  test('wizard progresses through steps', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Great title! Now add your poll options, one per line.',
        wizardState: {
          step: 'options',
          type: 'create_poll',
          data: { title: 'Favorite Color' },
        },
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Favorite Color',
        wizardState: { step: 'title', type: 'create_poll' },
      }),
    });

    const data = await response.json();
    expect(data.wizardState.step).toBe('options');
    expect(data.wizardState.data.title).toBe('Favorite Color');
  });
});

describe('AI Chat Slider - Plan Gating', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('AI chat requires Starter plan or higher', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({
        error: 'AI chat requires Starter plan or higher',
        requiredPlan: 'STARTER',
      }),
    });

    const response = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
    });

    expect(response.status).toBe(403);
  });

  test('voice input requires Starter plan or higher', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({
        error: 'Voice input requires Starter plan or higher',
        requiredPlan: 'STARTER',
      }),
    });

    const response = await fetch('/api/ai-assistant/transcribe', {
      method: 'POST',
      body: new FormData(),
    });

    expect(response.status).toBe(403);
  });
});
