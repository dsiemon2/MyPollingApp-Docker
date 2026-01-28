import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Default settings for fallback
const defaultSettings = {
  businessName: 'PoligoPro',
  tagline: 'Voice-Enabled Polling',
};

// Helper to get a setting from the database
export async function getSetting(key: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value ?? defaultSettings[key as keyof typeof defaultSettings] ?? '';
  } catch {
    return defaultSettings[key as keyof typeof defaultSettings] ?? '';
  }
}

// Helper to get all settings as an object
export async function getSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsObj: Record<string, string> = { ...defaultSettings };
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    return settingsObj;
  } catch {
    return { ...defaultSettings };
  }
}

export default prisma;
