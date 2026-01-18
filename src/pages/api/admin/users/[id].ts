import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const { id } = req.query;

  // Only SUPER_ADMIN can manage users
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - fetch single user
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: {
              plan: true,
              status: true
            }
          },
          _count: {
            select: {
              polls: true,
              votes: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // PATCH - update user
  if (req.method === 'PATCH') {
    try {
      const { email, name, role, password } = req.body;

      // Build update data
      const updateData: any = {};
      if (email) updateData.email = email;
      if (name !== undefined) updateData.name = name || null;
      if (role) updateData.role = role;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id: String(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.json(user);
    } catch (error: any) {
      console.error('Failed to update user:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email already in use' });
      }
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // DELETE - delete user
  if (req.method === 'DELETE') {
    try {
      // Prevent deleting yourself
      if ((session.user as any).id === String(id)) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await prisma.user.delete({
        where: { id: String(id) }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
