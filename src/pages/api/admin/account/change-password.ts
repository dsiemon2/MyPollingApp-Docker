import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // For demo purposes, just return success
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, error: 'Failed to change password' });
  }
}
