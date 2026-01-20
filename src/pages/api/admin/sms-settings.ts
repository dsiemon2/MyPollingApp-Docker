import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SMS_KEYS = ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number', 'sms_enabled'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || (session.user as any).role !== 'SUPER_ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { category: 'sms' }
      });

      const result: Record<string, string> = {};
      settings.forEach(s => {
        // Mask auth token for security
        if (s.key === 'twilio_auth_token' && s.value) {
          result[s.key] = '••••••••' + s.value.slice(-4);
        } else {
          result[s.key] = s.value;
        }
      });

      return res.status(200).json(result);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Get SMS settings error:');
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { twilio_account_sid, twilio_auth_token, twilio_phone_number, sms_enabled } = req.body;

      const settingsToSave = [
        { key: 'twilio_account_sid', value: twilio_account_sid || '', type: 'string' },
        { key: 'twilio_auth_token', value: twilio_auth_token || '', type: 'string' },
        { key: 'twilio_phone_number', value: twilio_phone_number || '', type: 'string' },
        { key: 'sms_enabled', value: sms_enabled ? 'true' : 'false', type: 'boolean' }
      ];

      for (const setting of settingsToSave) {
        // Skip if auth token is masked (not changed)
        if (setting.key === 'twilio_auth_token' && setting.value?.startsWith('••••')) {
          continue;
        }

        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value, type: setting.type },
          create: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            category: 'sms'
          }
        });
      }

      return res.status(200).json({ success: true, message: 'SMS settings saved successfully' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Save SMS settings error:');
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
