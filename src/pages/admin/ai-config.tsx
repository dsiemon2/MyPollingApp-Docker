import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

export default function AIConfigPage() {
  const [config, setConfig] = useState({
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 500,
    successKeywords: '',
    objectionKeywords: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/ai-config')
      .then(res => res.json())
      .then(data => setConfig({ ...config, ...data }))
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      alert('Configuration saved!');
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout active="ai-config">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">AI Configuration</h1>
        <p className="text-gray-600 mt-1">Configure AI behavior and prompts</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Prompt</h2>
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
          rows={8}
          placeholder="You are a helpful AI assistant for a polling application..."
        />
        <p className="text-sm text-gray-500 mt-2">This prompt defines the AI's behavior and personality.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Model Parameters</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Lower = more focused, Higher = more creative</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Detection Keywords</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Success Keywords</label>
            <input
              type="text"
              value={config.successKeywords}
              onChange={(e) => setConfig({ ...config, successKeywords: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="yes, agree, confirm, accept"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objection Keywords</label>
            <input
              type="text"
              value={config.objectionKeywords}
              onChange={(e) => setConfig({ ...config, objectionKeywords: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="no, but, however, expensive"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </AdminLayout>
  );
}
