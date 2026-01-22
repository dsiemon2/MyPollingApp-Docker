import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const [voices, languages, selectedVoiceSetting, kbDocuments] = await Promise.all([
        prisma.voice.findMany({ orderBy: { name: 'asc' } }),
        prisma.language.findMany({ orderBy: { name: 'asc' } }),
        prisma.systemSetting.findFirst({ where: { key: 'selected_voice' } }),
        prisma.knowledgeDocument.findMany({
          select: { id: true, languageId: true, title: true, enabled: true }
        })
      ]);

      const defaultVoice = voices.find(v => v.isDefault);
      const selectedVoice = selectedVoiceSetting?.value || defaultVoice?.voiceId || 'alloy';

      // Count KB documents per language
      const kbCountsByLanguage: Record<string, number> = {};
      kbDocuments.forEach(doc => {
        if (doc.languageId) {
          kbCountsByLanguage[doc.languageId] = (kbCountsByLanguage[doc.languageId] || 0) + 1;
        }
      });

      // Add kbDocCount to each language
      const languagesWithKb = languages.map(lang => ({
        ...lang,
        kbDocCount: kbCountsByLanguage[lang.id] || 0
      }));

      return res.json({
        voices,
        languages: languagesWithKb,
        selectedVoice,
        totalKbDocuments: kbDocuments.length
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch voices' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { selectedVoice, name, voiceId, provider, language, gender, description, isDefault } = req.body;

      // If updating selected voice
      if (selectedVoice) {
        await prisma.systemSetting.upsert({
          where: { key: 'selected_voice' },
          update: { value: selectedVoice },
          create: { key: 'selected_voice', value: selectedVoice, category: 'voice' }
        });

        // Also update the isDefault on the voice record
        await prisma.voice.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
        await prisma.voice.updateMany({
          where: { voiceId: selectedVoice },
          data: { isDefault: true }
        });

        return res.json({ success: true, selectedVoice });
      }

      // If creating a new voice
      if (isDefault) {
        await prisma.voice.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const voice = await prisma.voice.create({
        data: { name, voiceId, provider, language, gender, description, isDefault }
      });
      return res.json(voice);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update voice' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
