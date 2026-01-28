import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Tool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  enabled: boolean;
}

const builtinTools = [
  { name: 'calculator', displayName: 'Calculator', description: 'Perform mathematical calculations', type: 'builtin' },
  { name: 'calendar', displayName: 'Calendar', description: 'Check dates and schedule events', type: 'builtin' },
  { name: 'poll_results', displayName: 'Poll Results', description: 'Fetch current poll results', type: 'builtin' },
  { name: 'summarizer', displayName: 'Summarizer', description: 'Summarize chat discussions', type: 'builtin' },
];

export default function AIToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', displayName: '', description: '', type: 'custom', endpoint: '' });

  useEffect(() => {
    fetch('/api/admin/ai-tools').then(res => res.json()).then(setTools).catch(console.error);
  }, []);

  const toggleTool = async (id: string, enabled: boolean) => {
    await fetch(`/api/admin/ai-tools/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    setTools(tools.map(t => t.id === id ? { ...t, enabled } : t));
  };

  return (
    <AdminLayout active="ai-tools">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Tools</h1>
          <p className="text-gray-600 mt-1">Configure tools available to the AI</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
          + Add Custom Tool
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Built-in Tools</h2>
        <div className="grid grid-cols-2 gap-4">
          {builtinTools.map((tool) => {
            const toolData = tools.find(t => t.name === tool.name);
            return (
              <div key={tool.name} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{tool.displayName}</h3>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={toolData?.enabled ?? true}
                    onChange={(e) => toolData && toggleTool(toolData.id, e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-700 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Custom Tools</h2>
        {tools.filter(t => t.type === 'custom').length === 0 ? (
          <p className="text-gray-500 text-center py-8">No custom tools configured yet.</p>
        ) : (
          <div className="space-y-3">
            {tools.filter(t => t.type === 'custom').map(tool => (
              <div key={tool.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{tool.displayName}</h3>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={tool.enabled}
                    onChange={(e) => toggleTool(tool.id, e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-700 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
