import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendWelcomeEmail } from '@/services/email.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER'
      }
    });

    // Create default FREE subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE'
      }
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ email: user.email, name: user.name }).catch((err) => {
      logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'Failed to send welcome email');
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Registration error:');
    res.status(500).json({ message: 'Failed to create user' });
  }
}
