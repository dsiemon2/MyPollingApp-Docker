import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';

const AI_SETTINGS_KEYS = [
  'ai_assistant_enabled',
  'ai_assistant_position',
  'ai_assistant_button_color',
  'ai_assistant_panel_width',
  'ai_assistant_voice_enabled',
  'ai_assistant_show_on_public',
  'ai_assistant_show_on_admin',
  'ai_assistant_welcome_message',
];

const DEFAULT_SETTINGS = {
  ai_assistant_enabled: 'true',
  ai_assistant_position: 'bottom-right',
  ai_assistant_button_color: '#1e40af',
  ai_assistant_panel_width: '380',
  ai_assistant_voice_enabled: 'true',
  ai_assistant_show_on_public: 'true',
  ai_assistant_show_on_admin: 'true',
  ai_assistant_welcome_message: "Hello! I'm your AI polling assistant. I can help you create polls, view results, analyze trends, and answer questions about your polling data. What would you like to do?",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication for non-GET requests
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    try {
      // Get all AI assistant settings
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: { in: AI_SETTINGS_KEYS },
        },
      });

      // Build settings object with defaults
      const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      // Transform to frontend format
      const response = {
        enabled: settingsMap.ai_assistant_enabled === 'true',
        position: settingsMap.ai_assistant_position,
        buttonColor: settingsMap.ai_assistant_button_color,
        panelWidth: parseInt(settingsMap.ai_assistant_panel_width, 10),
        voiceEnabled: settingsMap.ai_assistant_voice_enabled === 'true',
        showOnPublic: settingsMap.ai_assistant_show_on_public === 'true',
        showOnAdmin: settingsMap.ai_assistant_show_on_admin === 'true',
        welcomeMessage: settingsMap.ai_assistant_welcome_message,
      };

      return res.json(response);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch AI assistant settings');
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    // Require admin authentication for updates
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes(user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const {
        enabled,
        position,
        buttonColor,
        panelWidth,
        voiceEnabled,
        showOnPublic,
        showOnAdmin,
        welcomeMessage,
      } = req.body;

      // Update each setting
      const updates: { key: string; value: string }[] = [];

      if (enabled !== undefined) {
        updates.push({ key: 'ai_assistant_enabled', value: String(enabled) });
      }
      if (position !== undefined) {
        updates.push({ key: 'ai_assistant_position', value: position });
      }
      if (buttonColor !== undefined) {
        updates.push({ key: 'ai_assistant_button_color', value: buttonColor });
      }
      if (panelWidth !== undefined) {
        updates.push({ key: 'ai_assistant_panel_width', value: String(panelWidth) });
      }
      if (voiceEnabled !== undefined) {
        updates.push({ key: 'ai_assistant_voice_enabled', value: String(voiceEnabled) });
      }
      if (showOnPublic !== undefined) {
        updates.push({ key: 'ai_assistant_show_on_public', value: String(showOnPublic) });
      }
      if (showOnAdmin !== undefined) {
        updates.push({ key: 'ai_assistant_show_on_admin', value: String(showOnAdmin) });
      }
      if (welcomeMessage !== undefined) {
        updates.push({ key: 'ai_assistant_welcome_message', value: welcomeMessage });
      }

      // Upsert all settings
      for (const { key, value } of updates) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value, updatedAt: new Date() },
          create: {
            key,
            value,
            type: 'string',
            category: 'ai_assistant',
          },
        });
      }

      logger.info({ updates: updates.length }, 'AI assistant settings updated');

      return res.json({ success: true, updated: updates.length });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to update AI assistant settings');
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
