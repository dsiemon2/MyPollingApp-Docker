import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { canUseVoiceChat, PlanType } from '@/config/plans';
import logger from '@/utils/logger';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

// Disable body parsing - we need formidable for multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check user's subscription for voice chat feature
    const session = await getServerSession(req, res, authOptions);
    let userPlan: PlanType = 'FREE';

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true },
      });
      userPlan = (user?.subscription?.plan as PlanType) || 'FREE';
    }

    if (!canUseVoiceChat(userPlan)) {
      return res.status(403).json({
        success: false,
        error: 'Voice input requires a Starter plan or higher. Please upgrade to access this feature.',
        code: 'VOICE_CHAT_NOT_ALLOWED',
      });
    }

    // Check if OpenAI API key is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey === 'sk-your-openai-key') {
      return res.status(503).json({
        success: false,
        error: 'Voice transcription is not configured. Please set the OPENAI_API_KEY environment variable.',
      });
    }

    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
      allowEmptyFiles: false,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Get the audio file
    const audioFile = files.audio;
    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    const file = Array.isArray(audioFile) ? audioFile[0] : audioFile;

    // Validate file type
    const validTypes = ['audio/webm', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
    if (file.mimetype && !validTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Invalid audio format. Supported formats: webm, mp3, mp4, m4a, wav, ogg`,
      });
    }

    // Read the file
    const audioBuffer = fs.readFileSync(file.filepath);

    // Check minimum size (approximately 0.5 seconds of audio)
    if (audioBuffer.length < 5000) {
      // Clean up temp file
      fs.unlinkSync(file.filepath);
      return res.status(400).json({
        success: false,
        error: 'Recording too short. Please speak for at least one second.',
      });
    }

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: file.originalFilename || 'audio.webm',
      contentType: file.mimetype || 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        ...formData.getHeaders(),
      },
      body: formData.getBuffer() as unknown as BodyInit,
    });

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({}));
      logger.error({ status: whisperResponse.status, error: errorData }, 'Whisper API error');
      return res.status(500).json({
        success: false,
        error: 'Failed to transcribe audio',
      });
    }

    const data = await whisperResponse.json();

    if (!data.text || data.text.trim() === '') {
      return res.status(200).json({
        success: false,
        error: 'No speech detected in the recording. Please try again.',
      });
    }

    logger.info({ textLength: data.text.length }, 'Audio transcribed successfully');

    return res.json({
      success: true,
      text: data.text,
    });

  } catch (error: any) {
    logger.error({ error: error.message }, 'Transcription error');
    return res.status(500).json({
      success: false,
      error: 'Failed to process audio',
    });
  }
}
