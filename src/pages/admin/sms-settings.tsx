import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

export default function SmsSettingsPage() {
  const [settings, setSettings] = useState({
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    sms_enabled: false
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/sms-settings')
      .then(res => res.json())
      .then(data => setSettings({
        twilio_account_sid: data.twilio_account_sid || '',
        twilio_auth_token: data.twilio_auth_token || '',
        twilio_phone_number: data.twilio_phone_number || '',
        sms_enabled: data.sms_enabled === 'true'
      }))
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/sms-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'SMS settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      // Test Twilio connection by making API call
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}.json`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${settings.twilio_account_sid}:${settings.twilio_auth_token.startsWith('••••') ? '' : settings.twilio_auth_token}`)
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `Connected to Twilio account: ${data.friendly_name}` });
      } else {
        setMessage({ type: 'error', text: 'Invalid Twilio credentials. Please check your Account SID and Auth Token.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection test failed. Please save your credentials first.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout active="sms-settings">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">SMS Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure Twilio SMS notifications</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Twilio Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account SID</label>
              <input
                type="text"
                value={settings.twilio_account_sid}
                onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auth Token</label>
              <input
                type="password"
                value={settings.twilio_auth_token}
                onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your auth token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={settings.twilio_phone_number}
                onChange={(e) => setSettings({ ...settings, twilio_phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="smsEnabled"
                checked={settings.sms_enabled}
                onChange={(e) => setSettings({ ...settings, sms_enabled: e.target.checked })}
                className="h-4 w-4 text-green-700 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="smsEnabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable SMS Notifications
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing || !settings.twilio_account_sid}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              {testing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            About SMS Notifications
          </h2>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
            <p>
              SMS notifications allow you to send text messages to poll participants for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Poll invitations and reminders</li>
              <li>Voting confirmations</li>
              <li>Results announcements</li>
              <li>Account notifications</li>
            </ul>
            <p className="mt-4">
              <strong className="dark:text-gray-300">Getting Twilio Credentials:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-green-700 dark:text-green-400 hover:underline">twilio.com</a></li>
              <li>Navigate to your Twilio Console</li>
              <li>Find your Account SID and Auth Token on the dashboard</li>
              <li>Get a phone number from Twilio</li>
            </ol>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
