import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import ThemeToggle from '@/components/ThemeToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
  active: string;
}

const menuItems = [
  { section: 'Dashboard' },
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: '/admin' },
  { id: 'analytics', label: 'Analytics', icon: '📊', href: '/admin/analytics' },
  { id: 'polls', label: 'Poll Management', icon: '🗳️', href: '/admin/polls' },
  { id: 'poll-types', label: 'Poll Types', icon: '📋', href: '/admin/poll-types' },
  { id: 'poll-templates', label: 'Templates', icon: '📑', href: '/admin/poll-templates' },

  { section: 'AI Settings' },
  { id: 'ai-providers', label: 'AI Providers', icon: '🧠', href: '/admin/ai-providers' },
  { id: 'greeting', label: 'Greeting', icon: '💬', href: '/admin/greeting' },
  { id: 'voices', label: 'Voices & Mode', icon: '🔊', href: '/admin/voices' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: '📚', href: '/admin/knowledge-base' },
  { id: 'ai-config', label: 'AI Config', icon: '⚙️', href: '/admin/ai-config' },
  { id: 'ai-tools', label: 'AI Tools', icon: '🔧', href: '/admin/ai-tools' },
  { id: 'ai-agents', label: 'AI Agents', icon: '🤖', href: '/admin/ai-agents' },
  { id: 'logic-rules', label: 'Logic Rules', icon: '🔀', href: '/admin/logic-rules' },
  { id: 'functions', label: 'Functions', icon: '💻', href: '/admin/functions' },

  { section: 'Integrations' },
  { id: 'webhooks', label: 'Webhooks', icon: '🔗', href: '/admin/webhooks' },
  { id: 'sms-settings', label: 'SMS Settings', icon: '💬', href: '/admin/sms-settings' },
  { id: 'payment-processing', label: 'Payment Gateways', icon: '💳', href: '/admin/payment-processing' },

  { section: 'Billing' },
  { id: 'trial-codes', label: 'Trial Codes', icon: '🎟️', href: '/admin/trial-codes' },

  { section: 'Account' },
  { id: 'account', label: 'Account Settings', icon: '🔐', href: '/admin/account' },
  { id: 'my-subscription', label: 'My Subscription', icon: '📋', href: '/admin/my-subscription' },
  { id: 'pricing', label: 'Pricing Plans', icon: '🏷️', href: '/admin/pricing' },

  { section: 'System' },
  { id: 'users', label: 'User Management', icon: '👥', href: '/admin/users' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '💎', href: '/admin/subscriptions' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
];

export default function AdminLayout({ children, active }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'USER') {
        router.push('/polls');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 admin-sidebar flex-shrink-0 flex flex-col">
        <div className="p-4 text-white flex-shrink-0">
          <Link href="/" className="block">
            <img
              src={settings.logoUrl || '/images/PoligoPro.png'}
              alt={`${settings.businessName} Logo`}
              className="max-w-[180px] h-auto object-contain mx-auto"
            />
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/70">👤</span>
              <span className="truncate">{user?.name || 'Admin'}</span>
              <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{user?.role?.replace('_', ' ') || 'Admin'}</span>
            </div>
            <ThemeToggle className="!bg-white/20 !hover:bg-white/30" />
          </div>
        </div>

        <nav className="flex-1 pb-4 border-t border-white/10 pt-2">
          {menuItems.map((item, index) => {
            if (item.section) {
              return (
                <div key={index} className="nav-section mt-4 first:mt-0">
                  {item.section}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`nav-link flex items-center gap-3 ${active === item.id ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Logout at bottom of nav */}
          <div className="border-t border-white/10 mt-4 pt-2">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="nav-link flex items-center gap-3 w-full text-left text-white/70 hover:text-white"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
