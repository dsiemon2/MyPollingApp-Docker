import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  priority: number;
  enabled: boolean;
}

const triggers = ['message_received', 'session_start', 'vote_cast', 'poll_closed', 'ai_response'];
const actions = ['send_message', 'trigger_webhook', 'switch_agent', 'end_session', 'set_variable'];

export default function LogicRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', trigger: 'message_received', action: 'send_message', priority: 0 });

  useEffect(() => {
    fetch('/api/admin/logic-rules').then(res => res.json()).then(setRules).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/logic-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    fetch('/api/admin/logic-rules').then(res => res.json()).then(setRules);
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await fetch(`/api/admin/logic-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    setRules(rules.map(r => r.id === id ? { ...r, enabled } : r));
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await fetch(`/api/admin/logic-rules/${id}`, { method: 'DELETE' });
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <AdminLayout active="logic-rules">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Logic Rules</h1>
          <p className="text-gray-600 mt-1">Automate actions based on triggers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
          + Add Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">🔀</p>
            <p>No rules configured. Create your first automation rule.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{rule.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{rule.trigger}</span></td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">{rule.action}</span></td>
                  <td className="px-6 py-4 text-gray-600">{rule.priority}</td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={rule.enabled} onChange={(e) => toggleRule(rule.id, e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-green-700 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteRule(rule.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b"><h2 className="text-xl font-semibold">Add Rule</h2></div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                <select value={formData.trigger} onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  {triggers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select value={formData.action} onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  {actions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg" />
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
