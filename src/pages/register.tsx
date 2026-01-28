import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/hooks/useSettings';

export default function RegisterPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Navigation */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={settings.logoUrl || '/images/VotigoPro.png'}
              alt={`${settings.businessName} Logo`}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <Link href="/" className="text-purple-600 hover:text-purple-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl grid md:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="bg-gradient-to-br from-blue-900 to-green-600 p-10 text-white flex flex-col justify-center items-center text-center">
            <img
              src={settings.logoUrl || '/images/VotigoPro.png'}
              alt={`${settings.businessName} Logo`}
              className="mb-8 max-w-[220px] h-auto object-contain"
            />
            <h2 className="text-2xl font-bold mb-4">Join {settings.businessName}!</h2>
            <p className="text-white/80 mb-8">Create your account and start creating engaging polls with voice-powered AI features.</p>

            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl">
                <span className="text-xl">🗳️</span>
                <span>Create unlimited polls</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl">
                <span className="text-xl">📊</span>
                <span>Real-time analytics</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl">
                <span className="text-xl">🎤</span>
                <span>Voice-powered interaction</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl">
                <span className="text-xl">🆓</span>
                <span>Free to get started</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="p-10 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </h2>
            <p className="text-gray-500 mb-6">Fill in your details to get started</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    placeholder="At least 6 characters"
                    required
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

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg transition transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-purple-900 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
