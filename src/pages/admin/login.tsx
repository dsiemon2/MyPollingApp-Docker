import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/hooks/useSettings';

const demoAdmins = [
  { email: 'admin@mypollingapp.com', password: 'password123', role: 'Super Admin', icon: '🛡️' },
  { email: 'polladmin@mypollingapp.com', password: 'password123', role: 'Poll Admin', icon: '📊' },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Get the session to check user role
        const session = await getSession();
        const userRole = (session?.user as any)?.role;

        // Only allow admins - redirect regular users back to user login
        if (userRole === 'USER') {
          setError('Access denied. This login is for administrators only.');
          // Sign out the user since they're not an admin
          await fetch('/api/auth/signout', { method: 'POST' });
        } else {
          router.push('/admin');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Navigation */}
      <nav className="bg-white" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '15px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={settings.logoUrl || '/images/PoligoPro.png'}
              alt={`${settings.businessName} Logo`}
              style={{ height: '110px' }}
            />
          </Link>
          <Link href="/" style={{ color: '#0d7a3e', fontWeight: 500 }} className="flex items-center gap-2 hover:opacity-80 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: '40px 20px' }}>
        <div className="overflow-hidden" style={{ maxWidth: '500px', width: '100%', background: 'white', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
          <div className="p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
              <p className="text-gray-500 mt-2">Sign in to access the admin panel</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="admin@mypollingapp.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-xl font-semibold text-lg transition transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Sign In to Admin
                  </>
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h3 className="text-gray-700 font-medium text-sm mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Demo Admin Accounts
              </h3>
              <div className="flex flex-wrap gap-2">
                {demoAdmins.map((admin) => (
                  <button
                    key={admin.email}
                    type="button"
                    onClick={() => fillDemo(admin.email, admin.password)}
                    className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 border border-green-200"
                  >
                    <span>{admin.icon}</span>
                    {admin.role}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Not an admin?{' '}
                <Link href="/login" className="text-green-700 font-semibold hover:underline">
                  User Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
