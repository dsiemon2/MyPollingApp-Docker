import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface CustomFunction {
  id: string;
  name: string;
  displayName: string;
  description: string;
  code: string;
  enabled: boolean;
}

export default function FunctionsPage() {
  const [functions, setFunctions] = useState<CustomFunction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', displayName: '', description: '', code: '' });
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    fetch('/api/admin/functions').then(res => res.json()).then(setFunctions).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/functions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    setFormData({ name: '', displayName: '', description: '', code: '' });
    fetch('/api/admin/functions').then(res => res.json()).then(setFunctions);
  };

  const testFunction = async () => {
    // Server-side validation is safer than client-side eval
    try {
      const response = await fetch('/api/admin/functions/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.code })
      });
      const result = await response.json();
      if (result.success) {
        setTestResult(`Syntax valid. Result: ${JSON.stringify(result.result)}`);
      } else {
        setTestResult(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  const deleteFunction = async (id: string) => {
    if (!confirm('Delete this function?')) return;
    await fetch(`/api/admin/functions/${id}`, { method: 'DELETE' });
    setFunctions(functions.filter(f => f.id !== id));
  };

  return (
    <AdminLayout active="functions">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Custom Functions</h1>
          <p className="text-gray-600 mt-1">Create reusable JavaScript functions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
          + Create Function
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {functions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">💻</p>
            <p>No custom functions yet. Create your first function.</p>
          </div>
        ) : (
          <div className="divide-y">
            {functions.map(fn => (
              <div key={fn.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{fn.displayName}</h3>
                    <p className="text-sm text-gray-500">{fn.description}</p>
                    <code className="text-xs text-green-700 mt-2 block">{fn.name}()</code>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${fn.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {fn.enabled ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => deleteFunction(fn.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </div>
                </div>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{fn.code.slice(0, 100)}...</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Available Context Variables</h3>
        <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
          <code>session</code> - Current session data
          <code>user</code> - Current user info
          <code>poll</code> - Active poll data
          <code>messages</code> - Chat messages
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b"><h2 className="text-xl font-semibold">Create Function</h2></div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Function Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono" placeholder="myFunction" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input type="text" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <textarea value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm" rows={10}
                  placeholder="function() { return 'Hello'; }" required />
              </div>
              <div className="mb-4">
                <button type="button" onClick={testFunction} className="text-blue-600 hover:text-blue-800 text-sm">Test Function</button>
                {testResult && <pre className="mt-2 p-2 bg-gray-100 rounded text-xs">{testResult}</pre>}
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
