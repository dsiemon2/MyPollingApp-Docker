import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/hooks/useSettings';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useRef, useEffect } from 'react';

export default function SplashPage() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={settings.logoUrl || '/images/PoligoPro.png'}
              alt={`${settings.businessName} Logo`}
              style={{ maxWidth: '100%', width: '80%', height: '110px' }}
              className="object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-purple-600 transition">Features</a>
            <a href="#use-cases" className="text-gray-600 hover:text-purple-600 transition">Use Cases</a>
            <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-purple-600 transition">About</a>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            {session ? (
              <>
                <Link href="/polls" className="text-purple-600 hover:text-purple-800 px-4 py-2 transition">
                  Dashboard
                </Link>
                {(session.user as any)?.role !== 'USER' && (
                  <Link href="/admin" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                    Admin
                  </Link>
                )}
                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{session.user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                      </Link>
                      <hr className="my-2 border-gray-100 dark:border-gray-700" />
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-purple-600 border-2 border-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition">
                  Sign In
                </Link>
                <Link href="/register" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-green-600 text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm mb-6">
                <span>🗳️</span> Voice-Powered Polling Platform
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Smart Polling
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                  Made Simple
                </span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-lg">
                Create polls, gather votes, and discuss with AI-powered voice chat.
                Get real-time results and intelligent insights.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="bg-white/15 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <span>📊</span> Real-time Results
                </span>
                <span className="bg-white/15 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <span>🎤</span> Voice Chat
                </span>
                <span className="bg-white/15 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <span>🤖</span> AI Insights
                </span>
                <span className="bg-white/15 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <span>📱</span> Mobile Ready
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="bg-white text-purple-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-lg">
                  Start Free Trial
                </Link>
                <a href="#pricing" className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition">
                  View Pricing
                </a>
              </div>
            </div>

            {/* Demo Card */}
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-2xl p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                    📊
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">Live Poll</div>
                    <div className="text-gray-500 text-sm">Team Lunch Decision</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-gray-700 font-medium mb-3">Where should we order from?</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">🍕 Pizza Palace</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{width: '65%'}}></div>
                        </div>
                        <span className="text-sm text-gray-500">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">🍔 Burger Barn</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-400 h-2 rounded-full" style={{width: '25%'}}></div>
                        </div>
                        <span className="text-sm text-gray-500">25%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">🥗 Salad Stop</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-300 h-2 rounded-full" style={{width: '10%'}}></div>
                        </div>
                        <span className="text-sm text-gray-500">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">23 voters</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Live</span>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">2h left</span>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-green-500">+89%</div>
                <div className="text-gray-500 text-sm">Engagement</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg flex items-center gap-2">
                <span className="text-yellow-500 text-xl">⭐</span>
                <div>
                  <span className="font-bold text-gray-800">4.9</span>
                  <span className="text-gray-500 text-sm ml-1">Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Choose {settings.businessName}?</h2>
            <p className="text-gray-600 text-lg">Everything you need to run engaging polls and gather insights</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                📊
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Multiple Poll Types</h4>
              <p className="text-gray-600">Single choice, multiple choice, rating scales, NPS, ranked choice, and open text polls.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                ⚡
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Real-time Results</h4>
              <p className="text-gray-600">Watch votes come in live with automatic updates and beautiful visualizations.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🎤
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Voice Chat</h4>
              <p className="text-gray-600">Discuss poll topics with voice-to-text powered by OpenAI Whisper technology.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🤖
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">AI Assistant</h4>
              <p className="text-gray-600">Get intelligent summaries and insights from poll discussions automatically.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                📱
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Mobile Optimized</h4>
              <p className="text-gray-600">Perfect experience on any device - desktop, tablet, or smartphone.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🔒
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Secure & Private</h4>
              <p className="text-gray-600">Enterprise-grade security with anonymous voting options and data protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50" id="use-cases">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Perfect For Any Scenario</h2>
            <p className="text-gray-600 text-lg">From team decisions to customer feedback</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition hover:scale-105">
              <div className="text-4xl mb-2">👥</div>
              <span className="font-medium text-gray-700">Team Votes</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition hover:scale-105">
              <div className="text-4xl mb-2">📋</div>
              <span className="font-medium text-gray-700">Surveys</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition hover:scale-105">
              <div className="text-4xl mb-2">🎓</div>
              <span className="font-medium text-gray-700">Education</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition hover:scale-105">
              <div className="text-4xl mb-2">🏢</div>
              <span className="font-medium text-gray-700">Corporate</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition hover:scale-105">
              <div className="text-4xl mb-2">🎉</div>
              <span className="font-medium text-gray-700">Events</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition hover:scale-105">
              <div className="text-4xl mb-2">💬</div>
              <span className="font-medium text-gray-700">Feedback</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 text-lg">Start free, upgrade as you grow. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition hover:-translate-y-2">
              <div className="text-gray-500 font-semibold uppercase tracking-wide text-sm mb-2">Free</div>
              <div className="text-4xl font-bold text-gray-800 mb-1">$0<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 mb-6">Perfect for trying it out</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> 3 Active Polls
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Up to 50 Votes/Poll
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Basic Poll Types
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Real-time Results
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span>✗</span> Voice Chat
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span>✗</span> AI Insights
                </li>
              </ul>
              <Link href="/register?plan=free" className="block w-full text-center border-2 border-purple-600 text-purple-600 py-3 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition">
                Get Started Free
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition hover:-translate-y-2">
              <div className="text-gray-500 font-semibold uppercase tracking-wide text-sm mb-2">Starter</div>
              <div className="text-4xl font-bold text-gray-800 mb-1">$9.99<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 mb-6">For small teams</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> 10 Active Polls
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Up to 200 Votes/Poll
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> All Poll Types
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Voice Chat
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Basic AI Insights
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Email Support
                </li>
              </ul>
              <Link href="/register?plan=starter" className="block w-full text-center border-2 border-purple-600 text-purple-600 py-3 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition">
                Start Free Trial
              </Link>
            </div>

            {/* Professional Plan - Popular */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition hover:-translate-y-2 border-3 border-orange-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <div className="text-orange-500 font-semibold uppercase tracking-wide text-sm mb-2">Professional</div>
              <div className="text-4xl font-bold text-gray-800 mb-1">$29.99<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 mb-6">For growing organizations</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> 50 Active Polls
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Unlimited Votes
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Custom Branding
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Advanced AI Insights
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Analytics Dashboard
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Priority Support
                </li>
              </ul>
              <Link href="/register?plan=professional" className="block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-full font-semibold hover:from-purple-700 hover:to-indigo-700 transition">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition hover:-translate-y-2">
              <div className="text-purple-600 font-semibold uppercase tracking-wide text-sm mb-2">Enterprise</div>
              <div className="text-4xl font-bold text-gray-800 mb-1">$99<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 mb-6">For large organizations</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Unlimited Polls
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Unlimited Everything
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> White-label Options
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> API Access
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Custom Integrations
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Dedicated Support
                </li>
              </ul>
              <Link href="/register?plan=enterprise" className="block w-full text-center border-2 border-purple-600 text-purple-600 py-3 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition">
                Contact Sales
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-8">
            🛡️ 14-day free trial on all paid plans. No credit card required to start.
          </p>
        </div>
      </section>

      {/* About/Stats Section */}
      <section className="py-20 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Built for Modern Teams</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                We understand the challenges of gathering feedback and making group decisions.
                That&apos;s why we built {settings.businessName} - to make polling simple, engaging, and insightful.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Our platform combines the power of real-time voting with AI-driven insights,
                helping teams and organizations make better decisions faster.
              </p>
              <div className="flex gap-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">1,000+</div>
                  <div className="text-gray-500">Polls Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">50K+</div>
                  <div className="text-gray-500">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">99%</div>
                  <div className="text-gray-500">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-50 rounded-3xl p-16 inline-block">
                <div className="text-9xl opacity-30">🗳️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-700 to-green-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/80 mb-8">Start your free trial today - no credit card required</p>
          <Link href="/register" className="inline-block bg-white text-purple-900 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-lg">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={settings.logoUrl || '/images/PoligoPro.png'}
                  alt={`${settings.businessName} Logo`}
                  className="h-9 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400">{settings.tagline}</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#use-cases" className="hover:text-white transition">Use Cases</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
