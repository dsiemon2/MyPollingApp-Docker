import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useSettings } from '@/hooks/useSettings';
import ThemeToggle from '@/components/ThemeToggle';

interface PaymentMethod {
  id: string;
  cardType: string;
  cardLast4: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface NotificationPrefs {
  pollResultsEmail: boolean;
  pollResultsSms: boolean;
  pollResultsPush: boolean;
  newPollInviteEmail: boolean;
  newPollInviteSms: boolean;
  newPollInvitePush: boolean;
  pollClosingEmail: boolean;
  pollClosingSms: boolean;
  pollClosingPush: boolean;
  subscriptionEmail: boolean;
  subscriptionSms: boolean;
  subscriptionPush: boolean;
  paymentEmail: boolean;
  paymentSms: boolean;
  paymentPush: boolean;
  securityEmail: boolean;
  securitySms: boolean;
  securityPush: boolean;
}

interface Device {
  id: string;
  deviceName: string | null;
  deviceType: string;
  browser: string | null;
  osName: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState('login-security');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);

  // Edit modals
  const [editNameModal, setEditNameModal] = useState(false);
  const [editEmailModal, setEditEmailModal] = useState(false);
  const [editPhoneModal, setEditPhoneModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [addPaymentModal, setAddPaymentModal] = useState(false);

  // Form data
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load account data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      loadAccountData();
    }
  }, [status, router]);

  const loadAccountData = async () => {
    try {
      const res = await fetch('/api/account');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setPaymentMethods(data.paymentMethods || []);
        setNotificationPrefs(data.notificationPrefs || getDefaultNotificationPrefs());
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultNotificationPrefs = (): NotificationPrefs => ({
    pollResultsEmail: true,
    pollResultsSms: false,
    pollResultsPush: true,
    newPollInviteEmail: true,
    newPollInviteSms: false,
    newPollInvitePush: true,
    pollClosingEmail: true,
    pollClosingSms: false,
    pollClosingPush: true,
    subscriptionEmail: true,
    subscriptionSms: false,
    subscriptionPush: false,
    paymentEmail: true,
    paymentSms: false,
    paymentPush: false,
    securityEmail: true,
    securitySms: true,
    securityPush: true,
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/account/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, name: newName } : null);
        setEditNameModal(false);
        showMessage('success', 'Name updated successfully');
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to update name');
      }
    } catch (error) {
      showMessage('error', 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !emailPassword) return;
    setSaving(true);
    try {
      const res = await fetch('/api/account/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: emailPassword }),
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, email: newEmail } : null);
        setEditEmailModal(false);
        setEmailPassword('');
        showMessage('success', 'Email updated successfully');
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to update email');
      }
    } catch (error) {
      showMessage('error', 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhone = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/account/phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone || null }),
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, phone: newPhone || null } : null);
        setEditPhoneModal(false);
        showMessage('success', 'Phone updated successfully');
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to update phone');
      }
    } catch (error) {
      showMessage('error', 'Failed to update phone');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showMessage('success', 'Password changed successfully');
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to change password');
      }
    } catch (error) {
      showMessage('error', 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    try {
      const res = await fetch(`/api/account/payment-methods/${id}/default`, {
        method: 'PUT',
      });
      if (res.ok) {
        setPaymentMethods(prev => prev.map(pm => ({
          ...pm,
          isDefault: pm.id === id,
        })));
        showMessage('success', 'Default payment method updated');
      }
    } catch (error) {
      showMessage('error', 'Failed to update default payment method');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    try {
      const res = await fetch(`/api/account/payment-methods/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
        showMessage('success', 'Payment method removed');
      }
    } catch (error) {
      showMessage('error', 'Failed to remove payment method');
    }
  };

  const handleUpdateNotifications = async (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notificationPrefs!, [key]: value };
    setNotificationPrefs(updated);
    try {
      await fetch('/api/account/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Failed to update notification preference:', error);
    }
  };

  const handleRemoveDevice = async (id: string) => {
    if (!confirm('Are you sure you want to sign out this device?')) return;
    try {
      const res = await fetch(`/api/account/devices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== id));
        showMessage('success', 'Device signed out');
      }
    } catch (error) {
      showMessage('error', 'Failed to sign out device');
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out all other devices?')) return;
    try {
      const res = await fetch('/api/account/devices', {
        method: 'DELETE',
      });
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.isCurrent));
        showMessage('success', 'Signed out of all other devices');
      }
    } catch (error) {
      showMessage('error', 'Failed to sign out devices');
    }
  };

  const getCardIcon = (type: string) => {
    const icons: Record<string, string> = {
      visa: 'VISA',
      mastercard: 'MC',
      amex: 'AMEX',
      discover: 'DISC',
    };
    return icons[type.toLowerCase()] || type.toUpperCase();
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Account Settings - {settings.businessName}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '15px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={settings.logoUrl || '/images/PoligoPro.png'}
                alt={`${settings.businessName} Logo`}
                style={{ height: '110px' }}
              />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/polls" style={{ color: '#0d7a3e', fontWeight: 500 }} className="hover:opacity-80 transition">
                Polls
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hover:opacity-90 transition"
                style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Message Toast */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Account Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account, payments, and preferences</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2">
                {[
                  { id: 'login-security', label: 'Login & Security', icon: '🔐' },
                  { id: 'payment', label: 'Payment Options', icon: '💳' },
                  { id: 'notifications', label: 'Notifications', icon: '🔔' },
                  { id: 'devices', label: 'Your Devices', icon: '💻' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === tab.id
                        ? 'bg-green-100 dark:bg-blue-900/30 text-green-700 dark:text-green-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                {/* Login & Security */}
                {activeTab === 'login-security' && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Login & Security</h2>
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">Name</p>
                          <p className="text-gray-600 dark:text-gray-400">{profile?.name || 'Not set'}</p>
                        </div>
                        <button
                          onClick={() => { setNewName(profile?.name || ''); setEditNameModal(true); }}
                          className="text-green-700 hover:text-green-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Email */}
                      <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">Email</p>
                          <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                        </div>
                        <button
                          onClick={() => { setNewEmail(profile?.email || ''); setEditEmailModal(true); }}
                          className="text-green-700 hover:text-green-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">Phone Number</p>
                          <p className="text-gray-600 dark:text-gray-400">{profile?.phone || 'Not set'}</p>
                        </div>
                        <button
                          onClick={() => { setNewPhone(profile?.phone || ''); setEditPhoneModal(true); }}
                          className="text-green-700 hover:text-green-700 font-medium"
                        >
                          {profile?.phone ? 'Edit' : 'Add'}
                        </button>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">Password</p>
                          <p className="text-gray-600 dark:text-gray-400">Last changed: Unknown</p>
                        </div>
                        <button
                          onClick={() => setChangePasswordModal(true)}
                          className="text-green-700 hover:text-green-700 font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Options */}
                {activeTab === 'payment' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Payment Options</h2>
                      <button
                        onClick={() => setAddPaymentModal(true)}
                        className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                      >
                        <span>+</span> Add Payment Method
                      </button>
                    </div>

                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-4xl mb-4 block">💳</span>
                        <p className="text-gray-600 dark:text-gray-400">No payment methods saved</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Add a card for faster checkout and subscription billing</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {paymentMethods.map(pm => (
                          <div
                            key={pm.id}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                              pm.isDefault
                                ? 'border-green-500 bg-green-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-8 bg-gradient-to-r from-gray-700 to-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">
                                {getCardIcon(pm.cardType)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {pm.cardType.charAt(0).toUpperCase() + pm.cardType.slice(1)} ending in {pm.cardLast4}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Expires {pm.expiryMonth.toString().padStart(2, '0')}/{pm.expiryYear}
                                </p>
                              </div>
                              {pm.isDefault && (
                                <span className="bg-green-700 text-white text-xs px-2 py-1 rounded">Default</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!pm.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultPayment(pm.id)}
                                  className="text-green-700 hover:text-green-700 text-sm font-medium"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePayment(pm.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && notificationPrefs && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Notification Preferences</h2>
                    <div className="space-y-8">
                      {/* Poll Notifications */}
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <span>📊</span> Poll Notifications
                        </h3>
                        <div className="space-y-3">
                          <NotificationRow
                            label="Poll Results Available"
                            emailKey="pollResultsEmail"
                            smsKey="pollResultsSms"
                            pushKey="pollResultsPush"
                            prefs={notificationPrefs}
                            onUpdate={handleUpdateNotifications}
                          />
                          <NotificationRow
                            label="New Poll Invitations"
                            emailKey="newPollInviteEmail"
                            smsKey="newPollInviteSms"
                            pushKey="newPollInvitePush"
                            prefs={notificationPrefs}
                            onUpdate={handleUpdateNotifications}
                          />
                          <NotificationRow
                            label="Poll Closing Reminders"
                            emailKey="pollClosingEmail"
                            smsKey="pollClosingSms"
                            pushKey="pollClosingPush"
                            prefs={notificationPrefs}
                            onUpdate={handleUpdateNotifications}
                          />
                        </div>
                      </div>

                      {/* Subscription Notifications */}
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <span>💳</span> Subscription & Payment
                        </h3>
                        <div className="space-y-3">
                          <NotificationRow
                            label="Subscription Updates"
                            emailKey="subscriptionEmail"
                            smsKey="subscriptionSms"
                            pushKey="subscriptionPush"
                            prefs={notificationPrefs}
                            onUpdate={handleUpdateNotifications}
                          />
                          <NotificationRow
                            label="Payment Confirmations"
                            emailKey="paymentEmail"
                            smsKey="paymentSms"
                            pushKey="paymentPush"
                            prefs={notificationPrefs}
                            onUpdate={handleUpdateNotifications}
                          />
                        </div>
                      </div>

                      {/* Security Notifications */}
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <span>🔒</span> Security Alerts
                        </h3>
                        <div className="space-y-3">
                          <NotificationRow
                            label="Login from New Device"
                            emailKey="securityEmail"
                            smsKey="securitySms"
                            pushKey="securityPush"
                            prefs={notificationPrefs}
                            onUpdate={handleUpdateNotifications}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Your Devices */}
                {activeTab === 'devices' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Your Devices</h2>
                      {devices.length > 1 && (
                        <button
                          onClick={handleSignOutAllDevices}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Sign Out All Other Devices
                        </button>
                      )}
                    </div>

                    {devices.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-4xl mb-4 block">💻</span>
                        <p className="text-gray-600 dark:text-gray-400">No devices recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {devices.map(device => (
                          <div
                            key={device.id}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                              device.isCurrent
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-3xl">{getDeviceIcon(device.deviceType)}</span>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {device.browser || 'Unknown Browser'} on {device.osName || 'Unknown OS'}
                                  {device.isCurrent && (
                                    <span className="ml-2 text-green-600 text-sm">(This device)</span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Last active: {new Date(device.lastSeenAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!device.isCurrent && (
                              <button
                                onClick={() => handleRemoveDevice(device.id)}
                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                              >
                                Sign Out
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Name Modal */}
        {editNameModal && (
          <Modal onClose={() => setEditNameModal(false)} title="Edit Name">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Enter your name"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditNameModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateName}
                disabled={saving}
                className="flex-1 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </Modal>
        )}

        {/* Edit Email Modal */}
        {editEmailModal && (
          <Modal onClose={() => setEditEmailModal(false)} title="Edit Email">
            <div className="space-y-4">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Enter new email"
              />
              <input
                type="password"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Confirm with your password"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setEditEmailModal(false); setEmailPassword(''); }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmail}
                disabled={saving}
                className="flex-1 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </Modal>
        )}

        {/* Edit Phone Modal */}
        {editPhoneModal && (
          <Modal onClose={() => setEditPhoneModal(false)} title="Edit Phone Number">
            <input
              type="tel"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Enter phone number"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditPhoneModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePhone}
                disabled={saving}
                className="flex-1 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </Modal>
        )}

        {/* Change Password Modal */}
        {changePasswordModal && (
          <Modal onClose={() => setChangePasswordModal(false)} title="Change Password">
            <div className="space-y-4">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Current password"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="New password (min 8 characters)"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setChangePasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

// Modal Component
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Notification Row Component
function NotificationRow({
  label,
  emailKey,
  smsKey,
  pushKey,
  prefs,
  onUpdate,
}: {
  label: string;
  emailKey: keyof NotificationPrefs;
  smsKey: keyof NotificationPrefs;
  pushKey: keyof NotificationPrefs;
  prefs: NotificationPrefs;
  onUpdate: (key: keyof NotificationPrefs, value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs[emailKey] as boolean}
            onChange={e => onUpdate(emailKey, e.target.checked)}
            className="w-4 h-4 text-green-700 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs[smsKey] as boolean}
            onChange={e => onUpdate(smsKey, e.target.checked)}
            className="w-4 h-4 text-green-700 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">SMS</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs[pushKey] as boolean}
            onChange={e => onUpdate(pushKey, e.target.checked)}
            className="w-4 h-4 text-green-700 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Push</span>
        </label>
      </div>
    </div>
  );
}
