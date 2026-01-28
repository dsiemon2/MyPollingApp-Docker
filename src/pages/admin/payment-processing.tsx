import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface GatewayConfig {
  provider: string;
  isEnabled: boolean;
  publishableKey: string;
  secretKey: string;
  testMode: boolean;
  achEnabled: boolean;
  webhookSecret: string;
  merchantId: string;
}

// Payment gateway defaults - keys should be configured via admin UI or environment variables
// NEVER hardcode production API keys in source code
const defaultGateway = (provider: string): GatewayConfig => ({
  provider,
  isEnabled: false,
  publishableKey: '',
  secretKey: '',
  testMode: true, // Default to test mode for safety
  achEnabled: false,
  webhookSecret: '',
  merchantId: '',
});

export default function PaymentProcessingPage() {
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [gateways, setGateways] = useState<Record<string, GatewayConfig>>({
    stripe: defaultGateway('stripe'),
    paypal: defaultGateway('paypal'),
    braintree: defaultGateway('braintree'),
    square: defaultGateway('square'),
    authorize: defaultGateway('authorize'),
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/payment-gateways')
      .then(res => res.json())
      .then(data => {
        if (data.gateways) {
          const gatewayMap: Record<string, GatewayConfig> = {
            stripe: defaultGateway('stripe'),
            paypal: defaultGateway('paypal'),
            braintree: defaultGateway('braintree'),
            square: defaultGateway('square'),
            authorize: defaultGateway('authorize'),
          };
          data.gateways.forEach((g: GatewayConfig) => {
            gatewayMap[g.provider] = { ...defaultGateway(g.provider), ...g };
          });
          setGateways(gatewayMap);
          setMasterEnabled(data.gateways.some((g: GatewayConfig) => g.isEnabled));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleProviderToggle = (provider: string) => {
    setGateways(prev => {
      const updated = { ...prev };
      // Only one provider can be enabled at a time
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], isEnabled: key === provider ? !updated[key].isEnabled : false };
      });
      return updated;
    });
  };

  const updateGateway = (provider: string, field: keyof GatewayConfig, value: string | boolean) => {
    setGateways(prev => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterEnabled, gateways: Object.values(gateways) })
      });
      alert('Payment gateway settings saved!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="payment-processing">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="payment-processing">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Payment Gateways</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure payment gateway integrations</p>
      </div>

      {/* Master Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Enable Payment Processing</h2>
            <p className="text-gray-500 text-sm mt-1">Master toggle to enable/disable all payment processing</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={masterEnabled}
              onChange={(e) => setMasterEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-700"></div>
          </label>
        </div>
      </div>

      {masterEnabled && (
        <>
          {/* Stripe Configuration */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Stripe</h2>
                  <p className="text-gray-500 text-sm">Credit cards, ACH, Apple Pay, Google Pay</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateways.stripe.isEnabled}
                  onChange={() => handleProviderToggle('stripe')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-700"></div>
              </label>
            </div>

            {gateways.stripe.isEnabled && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                    <input
                      type="text"
                      value={gateways.stripe.publishableKey}
                      onChange={(e) => updateGateway('stripe', 'publishableKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="pk_live_... or pk_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={gateways.stripe.secretKey}
                      onChange={(e) => updateGateway('stripe', 'secretKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="sk_live_... or sk_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                    <input
                      type="password"
                      value={gateways.stripe.webhookSecret}
                      onChange={(e) => updateGateway('stripe', 'webhookSecret', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="whsec_..."
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateways.stripe.testMode}
                        onChange={(e) => updateGateway('stripe', 'testMode', e.target.checked)}
                        className="w-4 h-4 text-green-700 rounded"
                      />
                      <span className="text-sm text-gray-700">Test Mode</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateways.stripe.achEnabled}
                        onChange={(e) => updateGateway('stripe', 'achEnabled', e.target.checked)}
                        className="w-4 h-4 text-green-700 rounded"
                      />
                      <span className="text-sm text-gray-700">Enable ACH Bank Transfers</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Processing fee: 2.9% + 30c per transaction. ACH: 0.8% capped at $5</p>
              </div>
            )}
          </div>

          {/* PayPal Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🅿️</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">PayPal</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">PayPal Checkout, Pay Later, Venmo</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateways.paypal.isEnabled}
                  onChange={() => handleProviderToggle('paypal')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {gateways.paypal.isEnabled && (
              <div className="border-t dark:border-gray-700 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={gateways.paypal.publishableKey}
                      onChange={(e) => updateGateway('paypal', 'publishableKey', e.target.value)}
                      className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono text-sm"
                      placeholder="Client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={gateways.paypal.secretKey}
                      onChange={(e) => updateGateway('paypal', 'secretKey', e.target.value)}
                      className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono text-sm"
                      placeholder="Client Secret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook ID</label>
                    <input
                      type="text"
                      value={gateways.paypal.webhookSecret}
                      onChange={(e) => updateGateway('paypal', 'webhookSecret', e.target.value)}
                      className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono text-sm"
                      placeholder="Webhook ID"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateways.paypal.testMode}
                        onChange={(e) => updateGateway('paypal', 'testMode', e.target.checked)}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Sandbox Mode</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Processing fee: 3.49% + 49c per transaction</p>
              </div>
            )}
          </div>

          {/* Braintree Configuration */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🅿️</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Braintree (PayPal)</h2>
                  <p className="text-gray-500 text-sm">Credit cards, PayPal, Venmo</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateways.braintree.isEnabled}
                  onChange={() => handleProviderToggle('braintree')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {gateways.braintree.isEnabled && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                    <input
                      type="text"
                      value={gateways.braintree.merchantId}
                      onChange={(e) => updateGateway('braintree', 'merchantId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="Your merchant ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                    <input
                      type="text"
                      value={gateways.braintree.publishableKey}
                      onChange={(e) => updateGateway('braintree', 'publishableKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="Public key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
                    <input
                      type="password"
                      value={gateways.braintree.secretKey}
                      onChange={(e) => updateGateway('braintree', 'secretKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="Private key"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateways.braintree.testMode}
                        onChange={(e) => updateGateway('braintree', 'testMode', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Sandbox Mode</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Processing fee: 2.59% + 49c per transaction</p>
              </div>
            )}
          </div>

          {/* Square Configuration */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🟩</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Square</h2>
                  <p className="text-gray-500 text-sm">Credit cards, Square Cash App</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateways.square.isEnabled}
                  onChange={() => handleProviderToggle('square')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {gateways.square.isEnabled && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
                    <input
                      type="text"
                      value={gateways.square.publishableKey}
                      onChange={(e) => updateGateway('square', 'publishableKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="sq0idp-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                    <input
                      type="password"
                      value={gateways.square.secretKey}
                      onChange={(e) => updateGateway('square', 'secretKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="Access token"
                    />
                  </div>
                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateways.square.testMode}
                        onChange={(e) => updateGateway('square', 'testMode', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Sandbox Mode</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Processing fee: 2.6% + 10c per transaction</p>
              </div>
            )}
          </div>

          {/* Authorize.net Configuration */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔐</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Authorize.net</h2>
                  <p className="text-gray-500 text-sm">Credit cards, eChecks</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateways.authorize.isEnabled}
                  onChange={() => handleProviderToggle('authorize')}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {gateways.authorize.isEnabled && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Login ID</label>
                    <input
                      type="text"
                      value={gateways.authorize.publishableKey}
                      onChange={(e) => updateGateway('authorize', 'publishableKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="API Login ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Key</label>
                    <input
                      type="password"
                      value={gateways.authorize.secretKey}
                      onChange={(e) => updateGateway('authorize', 'secretKey', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="Transaction key"
                    />
                  </div>
                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateways.authorize.testMode}
                        onChange={(e) => updateGateway('authorize', 'testMode', e.target.checked)}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Sandbox Mode</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Processing fee: 2.9% + 30c per transaction</p>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Provider Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Stripe</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">PayPal</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Braintree</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Square</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Authorize.net</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Card Processing</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Apple Pay / Google Pay</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">PayPal / Venmo</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">ACH / Bank Transfer</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                    <td className="text-center py-3 px-4 text-red-600">No</td>
                    <td className="text-center py-3 px-4 text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Processing Fee</td>
                    <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">2.9% + 30c</td>
                    <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">3.49% + 49c</td>
                    <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">2.59% + 49c</td>
                    <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">2.6% + 10c</td>
                    <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">2.9% + 30c</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </AdminLayout>
  );
}
