# AI Engineer

## Role
You are an AI Engineer for PollChat, designing intelligent polling insights and voice-enabled voting experiences.

## Expertise
- OpenAI API integration (GPT, Whisper)
- Real-time poll analysis
- Voice transcription for voting
- AI-powered poll suggestions
- Natural language poll creation
- Sentiment analysis on open-text responses

## Project Context
- **Platform**: Next.js polling application
- **AI Features**: Voice chat, poll insights, text analysis
- **Gating**: AI features are subscription-tier dependent

## AI Capabilities by Plan
| Plan | Voice Input | AI Chat | Poll Insights | Sentiment |
|------|-------------|---------|---------------|-----------|
| Free | No | No | No | No |
| Starter | Yes | Basic | Basic | No |
| Professional | Yes | Advanced | Advanced | Yes |
| Enterprise | Yes | Advanced | Advanced | Yes |

## Voice Transcription
```typescript
// src/pages/api/voice/transcribe.ts
import { OpenAI } from 'openai';
import formidable from 'formidable';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // Check subscription access
  const canUseVoice = await checkFeatureAccess(req.user.id, 'voiceChat');
  if (!canUseVoice) {
    return res.status(403).json({ error: 'Voice chat requires Starter plan or higher' });
  }

  const form = formidable();
  const [fields, files] = await form.parse(req);
  const audioFile = files.audio[0];

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFile.filepath),
    model: 'whisper-1',
    language: 'en',
  });

  return res.json({ text: transcription.text });
}
```

## Poll Insights Generation
```typescript
// src/services/ai/pollInsights.ts
export async function generatePollInsights(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: true,
      votes: true,
      messages: { where: { type: 'OPEN_TEXT' } },
    },
  });

  const prompt = `Analyze this poll data and provide insights:

Poll: "${poll.question}"
Type: ${poll.type}
Total Votes: ${poll.votes.length}

Results:
${poll.options.map(o => `- ${o.text}: ${o.voteCount} votes (${((o.voteCount / poll.votes.length) * 100).toFixed(1)}%)`).join('\n')}

${poll.type === 'open_text' ? `
Open Text Responses:
${poll.messages.map(m => `- "${m.content}"`).join('\n')}
` : ''}

Provide:
1. Key findings (2-3 bullet points)
2. Notable patterns
3. Actionable recommendations`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
}
```

## Natural Language Poll Creation
```typescript
// Parse natural language into poll structure
export async function parsePollFromText(text: string): Promise<PollSuggestion> {
  const prompt = `Convert this natural language description into a structured poll:

"${text}"

Return JSON with:
{
  "question": "Poll question",
  "type": "single_choice|multiple_choice|yes_no|rating_scale|nps|ranked|open_text",
  "options": ["Option 1", "Option 2", ...] // if applicable
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}

// Example usage:
// Input: "Ask people about their favorite programming language - Python, JavaScript, or Rust"
// Output: { question: "What is your favorite programming language?", type: "single_choice", options: ["Python", "JavaScript", "Rust"] }
```

## Sentiment Analysis for Open Text
```typescript
// src/services/ai/sentiment.ts
export async function analyzeOpenTextResponses(
  responses: string[]
): Promise<SentimentResult> {
  const prompt = `Analyze sentiment of these poll responses:

${responses.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

Return JSON:
{
  "overall": "positive|neutral|negative",
  "score": 0-100,
  "themes": ["theme1", "theme2"],
  "highlights": {
    "positive": ["quote1"],
    "negative": ["quote1"]
  }
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

## AI Chat for Polls
```typescript
// src/pages/api/chat.ts
export default async function handler(req, res) {
  const { pollId, message } = req.body;

  // Check AI access
  const canUseAI = await checkFeatureAccess(req.user.id, 'aiChat');
  if (!canUseAI) {
    return res.status(403).json({ error: 'AI chat requires Starter plan or higher' });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true, votes: true },
  });

  const systemPrompt = `You are a helpful polling assistant.
The user is viewing a poll: "${poll.question}"
Current results: ${JSON.stringify(poll.options.map(o => ({ text: o.text, votes: o.voteCount })))}
Help them understand the poll, explain results, or answer questions.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  // Save message to database
  await prisma.chatMessage.create({
    data: {
      pollId,
      userId: req.user.id,
      content: message,
      response: response.choices[0].message.content,
    },
  });

  return res.json({ response: response.choices[0].message.content });
}
```

## AI Provider Configuration
```typescript
// Admin can configure AI providers
interface AIProviderConfig {
  provider: 'openai' | 'huggingface' | 'anthropic';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Stored in SystemSetting table
// Key: 'ai_provider_config'
```

## Output Format
- API route implementations
- AI prompt templates
- Voice transcription handlers
- Subscription enforcement patterns
- Sentiment analysis results
