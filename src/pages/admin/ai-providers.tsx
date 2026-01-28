import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Model {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

interface Provider {
  id: string;
  code: string;
  name: string;
  description: string;
  apiKey?: string;
  maskedApiKey?: string;
  isConfigured: boolean;
  isActive: boolean;
  isSelected: boolean;
  defaultModel: string;
  availableModels: Model[];
  temperature: number;
  maxTokens: number;
  apiBaseUrl: string;
  icon: string;
}

const providerDefinitions: Record<string, { name: string; description: string; icon: string; models: Model[]; defaultModel: string; apiBaseUrl: string; apiKeyLink: string }> = {
  huggingface: {
    name: 'Hugging Face',
    description: 'Open-source models including Mistral, Llama, and more',
    icon: '🤗',
    models: [
      { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B Instruct v0.2', description: 'Fast and capable instruction model', recommended: true },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'MoE architecture, more powerful' },
      { id: 'meta-llama/Llama-2-70b-chat-hf', name: 'Llama 2 70B Chat', description: 'Meta\'s large chat model' },
      { id: 'meta-llama/Llama-2-13b-chat-hf', name: 'Llama 2 13B Chat', description: 'Balanced performance' },
      { id: 'HuggingFaceH4/zephyr-7b-beta', name: 'Zephyr 7B', description: 'Fine-tuned for helpfulness' },
    ],
    defaultModel: 'mistralai/Mistral-7B-Instruct-v0.2',
    apiBaseUrl: 'https://api-inference.huggingface.co',
    apiKeyLink: 'https://huggingface.co/settings/tokens'
  },
  openai: {
    name: 'OpenAI',
    description: 'ChatGPT models including GPT-4o and GPT-4.5',
    icon: '🤖',
    models: [
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', description: 'Latest preview model' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable multimodal', recommended: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'GPT-4 with vision' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Original GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Legacy fast model' },
      { id: 'o1-preview', name: 'o1 Preview', description: 'Advanced reasoning model' },
      { id: 'o1-mini', name: 'o1 Mini', description: 'Fast reasoning model' },
    ],
    defaultModel: 'gpt-4o',
    apiBaseUrl: 'https://api.openai.com/v1',
    apiKeyLink: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Claude 4 Opus, Claude 3.5 Sonnet, and other Claude models',
    icon: '🧠',
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Most powerful Claude model', recommended: true },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Balanced power and speed' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Previous gen, still excellent' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast and efficient' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Previous flagship' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest Claude model' },
    ],
    defaultModel: 'claude-opus-4-5-20251101',
    apiBaseUrl: 'https://api.anthropic.com/v1',
    apiKeyLink: 'https://console.anthropic.com/settings/keys'
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Gemini 2.0 and Gemini 1.5 models from Google',
    icon: '💎',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Latest Gemini model', recommended: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable 1.5 model' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'General purpose' },
    ],
    defaultModel: 'gemini-2.0-flash-exp',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyLink: 'https://aistudio.google.com/app/apikey'
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'DeepSeek V3 and specialized coding models',
    icon: '🔍',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', description: 'Latest chat model', recommended: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'Advanced reasoning' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Specialized for code' },
    ],
    defaultModel: 'deepseek-chat',
    apiBaseUrl: 'https://api.deepseek.com/v1',
    apiKeyLink: 'https://platform.deepseek.com/api_keys'
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with Groq LPU',
    icon: '⚡',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Latest Llama model', recommended: true },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: 'Powerful open model' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Fast and efficient' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'MoE architecture' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google open model' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
    apiKeyLink: 'https://console.groq.com/keys'
  },
  mistral: {
    name: 'Mistral AI',
    description: 'Mistral Large 2, Pixtral, and Codestral models',
    icon: '🌀',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large 2', description: 'Flagship model, 128k context', recommended: true },
      { id: 'pixtral-large-latest', name: 'Pixtral Large', description: 'Multimodal with vision' },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Fast and affordable' },
      { id: 'codestral-latest', name: 'Codestral', description: 'Specialized for code' },
      { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', description: 'Open-weight MoE' },
      { id: 'ministral-8b-latest', name: 'Ministral 8B', description: 'Compact efficient model' },
    ],
    defaultModel: 'mistral-large-latest',
    apiBaseUrl: 'https://api.mistral.ai/v1',
    apiKeyLink: 'https://console.mistral.ai/api-keys/'
  },
  grok: {
    name: 'Grok (xAI)',
    description: 'Elon Musk\'s xAI models with real-time X data',
    icon: '❌',
    models: [
      { id: 'grok-2-latest', name: 'Grok 2', description: 'Latest flagship model', recommended: true },
      { id: 'grok-2-vision-latest', name: 'Grok 2 Vision', description: 'Multimodal with vision' },
      { id: 'grok-beta', name: 'Grok Beta', description: 'Previous version' },
      { id: 'grok-vision-beta', name: 'Grok Vision Beta', description: 'Previous vision model' },
    ],
    defaultModel: 'grok-2-latest',
    apiBaseUrl: 'https://api.x.ai/v1',
    apiKeyLink: 'https://console.x.ai/'
  }
};

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const selectedProvider = providers.find(p => p.isSelected && p.isConfigured);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/ai-providers');
      if (res.ok) {
        const data = await res.json();
        // Merge with definitions to get icons and full model lists
        const merged = Object.keys(providerDefinitions).map(code => {
          const dbProvider = data.find((p: Provider) => p.name === code);
          const def = providerDefinitions[code];
          return {
            id: dbProvider?.id || code,
            code,
            name: def.name,
            description: def.description,
            icon: def.icon,
            apiKey: dbProvider?.apiKey,
            maskedApiKey: dbProvider?.apiKey ? maskApiKey(dbProvider.apiKey) : undefined,
            isConfigured: !!dbProvider?.apiKey,
            isActive: dbProvider?.enabled ?? true,
            isSelected: dbProvider?.isDefault ?? (code === 'huggingface'),
            defaultModel: dbProvider?.model || def.defaultModel,
            availableModels: def.models,
            temperature: 0.7,
            maxTokens: 4096,
            apiBaseUrl: def.apiBaseUrl
          };
        });
        setProviders(merged);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Initialize with definitions if fetch fails
      const initial = Object.keys(providerDefinitions).map(code => {
        const def = providerDefinitions[code];
        return {
          id: code,
          code,
          name: def.name,
          description: def.description,
          icon: def.icon,
          isConfigured: false,
          isActive: true,
          isSelected: code === 'huggingface',
          defaultModel: def.defaultModel,
          availableModels: def.models,
          temperature: 0.7,
          maxTokens: 4096,
          apiBaseUrl: def.apiBaseUrl
        };
      });
      setProviders(initial);
    } finally {
      setLoading(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  };

  const saveApiKey = async (code: string) => {
    const key = apiKeys[code];
    if (!key) return;

    setSaving(code);
    try {
      const provider = providers.find(p => p.code === code);
      if (provider && provider.id !== code) {
        await fetch(`/api/admin/ai-providers/${provider.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: key })
        });
      } else {
        await fetch('/api/admin/ai-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: code,
            displayName: providerDefinitions[code].name,
            apiKey: key,
            model: providerDefinitions[code].defaultModel,
            enabled: true,
            isDefault: code === 'huggingface'
          })
        });
      }
      setApiKeys({ ...apiKeys, [code]: '' });
      fetchProviders();
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setSaving(null);
    }
  };

  const selectProvider = async (code: string) => {
    const provider = providers.find(p => p.code === code);
    if (!provider?.isConfigured) return;

    setSaving(code);
    try {
      // First deselect all
      for (const p of providers) {
        if (p.id !== code && p.isSelected) {
          await fetch(`/api/admin/ai-providers/${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDefault: false })
          });
        }
      }
      // Then select this one
      await fetch(`/api/admin/ai-providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      fetchProviders();
    } catch (error) {
      console.error('Failed to select provider:', error);
    } finally {
      setSaving(null);
    }
  };

  const toggleProvider = async (code: string, enabled: boolean) => {
    const provider = providers.find(p => p.code === code);
    if (!provider) return;

    try {
      await fetch(`/api/admin/ai-providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      fetchProviders();
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  };

  const updateModel = async (code: string, model: string) => {
    const provider = providers.find(p => p.code === code);
    if (!provider) return;

    try {
      await fetch(`/api/admin/ai-providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      fetchProviders();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const testConnection = async (code: string) => {
    setTesting(code);
    const provider = providers.find(p => p.code === code);
    if (!provider?.apiKey) {
      setTesting(null);
      alert('Please enter an API key first');
      return;
    }

    try {
      const response = await fetch('/api/admin/ai-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: code,
          apiKey: provider.apiKey,
          model: provider.defaultModel
        })
      });

      const result = await response.json();
      setTesting(null);

      if (result.success) {
        alert(`${providerDefinitions[code].name} connection successful!`);
      } else {
        alert(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      setTesting(null);
      alert('Connection test failed. Check your network and try again.');
    }
  };

  if (loading) {
    return (
      <AdminLayout active="ai-providers">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="ai-providers">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">AI Model Configuration</h1>
        <p className="text-gray-600 mt-1">Configure and select your AI provider</p>
      </div>

      {/* Active Provider Summary */}
      {selectedProvider ? (
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm opacity-80 uppercase tracking-wide">Currently Active Provider</div>
              <div className="text-2xl font-bold">{selectedProvider.name}</div>
              <div className="text-sm opacity-90">Model: {selectedProvider.defaultModel}</div>
            </div>
            <div className="text-6xl opacity-30">✓</div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <strong>No AI Provider Configured</strong> - Configure an API key below to enable AI features.
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border-r border-blue-200 pr-4">
            <div className="font-semibold text-blue-800 mb-1">🔘 Available Toggle</div>
            <div className="text-sm text-gray-600">Enable/disable providers. Disabled providers won't appear as options.</div>
          </div>
          <div className="pl-4">
            <div className="font-semibold text-green-700 mb-1">✓ Select Button</div>
            <div className="text-sm text-gray-600">Choose which provider to use. <strong>Only one can be active at a time.</strong></div>
          </div>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {providers.map((provider) => {
          const def = providerDefinitions[provider.code];
          return (
            <div
              key={provider.code}
              className={`bg-white rounded-xl shadow-sm p-5 border-2 transition-all relative ${
                provider.isSelected && provider.isConfigured ? 'border-green-500' : 'border-gray-200'
              } ${!provider.isActive ? 'opacity-50' : ''}`}
            >
              {/* Toggle Switch */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase">
                  {provider.isActive ? 'Available' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={provider.isActive}
                    onChange={(e) => toggleProvider(provider.code, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {/* Selected Badge */}
              {provider.isSelected && provider.isConfigured && (
                <div className="absolute top-3 left-3">
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">✓ Active</span>
                </div>
              )}

              {/* Provider Header */}
              <div className="text-center pt-6 pb-4 border-b border-gray-100 mb-4">
                <div className={`text-4xl mb-2 ${provider.isConfigured ? '' : 'grayscale opacity-50'}`}>
                  {provider.icon}
                </div>
                <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
              </div>

              {/* API Key Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  🔑 API Key
                  {provider.isConfigured ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Configured</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">Not Set</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder={provider.maskedApiKey || 'Enter API key...'}
                    value={apiKeys[provider.code] || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, [provider.code]: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => saveApiKey(provider.code)}
                    disabled={!apiKeys[provider.code] || saving === provider.code}
                    className="px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                  >
                    {saving === provider.code ? '...' : '💾'}
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">📦 Model</label>
                <select
                  value={provider.defaultModel}
                  onChange={(e) => updateModel(provider.code, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  {provider.availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.recommended ? '(Recommended)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {provider.availableModels.find(m => m.id === provider.defaultModel)?.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => testConnection(provider.code)}
                  disabled={!provider.isConfigured || testing === provider.code}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing === provider.code ? '⏳ Testing...' : '🔌 Test'}
                </button>
                <button
                  onClick={() => selectProvider(provider.code)}
                  disabled={!provider.isConfigured || saving === provider.code}
                  className={`flex-1 py-2 text-sm rounded-lg transition ${
                    provider.isSelected && provider.isConfigured
                      ? 'bg-green-600 text-white'
                      : 'bg-green-700 text-white hover:bg-green-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {provider.isSelected && provider.isConfigured ? '✓ Selected' : '✓ Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">ℹ️ How It Works</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-2"><span className="font-bold">1.</span> Enter your API key for any provider</li>
            <li className="flex gap-2"><span className="font-bold">2.</span> Select your preferred model</li>
            <li className="flex gap-2"><span className="font-bold">3.</span> Click "Test" to verify the connection</li>
            <li className="flex gap-2"><span className="font-bold">4.</span> Click "Select" to make it active</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">🔗 Get API Keys</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(providerDefinitions).map(([code, def]) => (
              <li key={code}>
                <a
                  href={def.apiKeyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  {def.icon} {def.name} API Keys ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
