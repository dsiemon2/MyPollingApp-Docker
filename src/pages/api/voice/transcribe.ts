import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { IncomingForm, File } from 'formidable';
import { prisma } from '@/lib/prisma';
import { canUseVoiceChat, PlanType } from '@/config/plans';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
        include: { subscription: true }
      });
      userPlan = (user?.subscription?.plan as PlanType) || 'FREE';
    }

    if (!canUseVoiceChat(userPlan)) {
      return res.status(403).json({
        error: 'Voice chat requires a Starter plan or higher. Please upgrade to access this feature.',
        code: 'VOICE_CHAT_NOT_ALLOWED'
      });
    }

    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'tmp'),
      keepExtensions: true
    });

    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const { files } = await new Promise<{ files: Record<string, File[]> }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ files: files as Record<string, File[]> });
      });
    });

    const audioFile = files.audio?.[0];
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1'
    });

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    return res.json({ text: transcription.text });
  } catch (error: any) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Transcription error:');
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}
