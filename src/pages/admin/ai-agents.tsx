import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  enabled: boolean;
}

const templateAgents = [
  {
    name: 'helpful',
    displayName: 'Helpful Assistant',
    description: 'Friendly and informative',
    systemPrompt: 'You are a friendly and helpful AI assistant. You provide clear, accurate information while maintaining a warm and approachable tone. You help users understand polls and encourage thoughtful discussion.',
    temperature: 0.7
  },
  {
    name: 'analytical',
    displayName: 'Analytical',
    description: 'Data-focused and precise',
    systemPrompt: 'You are a data-focused analytical assistant. You provide precise, factual responses backed by the data available. Focus on statistics, trends, and objective analysis of poll results.',
    temperature: 0.3
  },
  {
    name: 'creative',
    displayName: 'Creative',
    description: 'Imaginative responses',
    systemPrompt: 'You are a creative and imaginative assistant. You provide engaging, thought-provoking responses that encourage deeper thinking about poll topics. Use metaphors and interesting perspectives.',
    temperature: 1.2
  },
  {
    name: 'formal',
    displayName: 'Formal',
    description: 'Professional and business-like',
    systemPrompt: 'You are a professional business assistant. Maintain a formal, polished tone suitable for corporate environments. Provide concise, well-structured responses appropriate for business settings.',
    temperature: 0.5
  },
];

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', displayName: '', description: '', systemPrompt: '', temperature: 0.7 });

  useEffect(() => {
    fetch('/api/admin/ai-agents').then(res => res.json()).then(setAgents).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/ai-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    setFormData({ name: '', displayName: '', description: '', systemPrompt: '', temperature: 0.7 });
    fetch('/api/admin/ai-agents').then(res => res.json()).then(setAgents);
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    await fetch(`/api/admin/ai-agents/${id}`, { method: 'DELETE' });
    setAgents(agents.filter(a => a.id !== id));
  };

  const toggleAgent = async (id: string, enabled: boolean) => {
    await fetch(`/api/admin/ai-agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled })
    });
    setAgents(agents.map(a => a.id === id ? { ...a, enabled: !enabled } : a));
  };

  return (
    <AdminLayout active="ai-agents">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Agents</h1>
          <p className="text-gray-600 mt-1">Configure different AI personalities</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
          + Create Agent
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Agent Templates</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templateAgents.map(agent => (
            <div key={agent.name} className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-green-300 cursor-pointer"
              onClick={() => { setFormData({ ...agent, name: `${agent.name}_${Date.now()}` }); setShowModal(true); }}>
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-medium text-gray-800">{agent.displayName}</h3>
              <p className="text-xs text-gray-500 mt-1">{agent.description}</p>
              <p className="text-xs text-green-700 mt-2">Temp: {agent.temperature}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Custom Agents</h2>
        {agents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No custom agents. Click a template above or create your own.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">{agent.displayName}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAgent(agent.id, agent.enabled)}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${agent.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {agent.enabled ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">{agent.description}</p>
                {agent.systemPrompt && (
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-2 max-h-20 overflow-y-auto">
                    <span className="font-medium">Prompt:</span> {agent.systemPrompt.slice(0, 150)}...
                  </div>
                )}
                <p className="text-xs text-green-700">Temperature: {agent.temperature}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b"><h2 className="text-xl font-semibold">Create Agent</h2></div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input type="text" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                <textarea value={formData.systemPrompt} onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm" rows={4}
                  placeholder="Enter the system prompt that defines this agent's personality and behavior..." />
                <p className="text-xs text-gray-500 mt-1">This prompt defines how the AI will behave and respond to users.</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature: {formData.temperature}</label>
                <input type="range" min="0" max="2" step="0.1" value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Precise (0)</span>
                  <span>Balanced (1)</span>
                  <span>Creative (2)</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
