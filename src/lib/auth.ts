import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { NextApiRequest, NextApiResponse } from 'next';

// Re-export authOptions for convenience
export { authOptions };

export type UserRole = 'SUPER_ADMIN' | 'POLL_ADMIN' | 'USER';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export async function getSession(req: NextApiRequest, res: NextApiResponse) {
  return await getServerSession(req, res, authOptions);
}

export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'POLL_ADMIN';
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

// Middleware to check authentication and role
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: SessionUser) => Promise<void>,
  requiredRoles?: UserRole[]
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);

    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = session.user as SessionUser;

    if (requiredRoles && !hasRole(user.role, requiredRoles)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    return handler(req, res, user);
  };
}
