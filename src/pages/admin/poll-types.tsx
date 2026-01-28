import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

interface PollType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  defaultConfig: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  _count: {
    polls: number;
    templates: number;
  };
}

const categoryColors: Record<string, string> = {
  choice: 'bg-blue-100 text-blue-800',
  rating: 'bg-yellow-100 text-yellow-800',
  ranking: 'bg-green-100 text-green-800',
  text: 'bg-green-100 text-green-800'
};

export default function PollTypesPage() {
  const [pollTypes, setPollTypes] = useState<PollType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<PollType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: '',
    category: 'choice',
    defaultConfig: '{}'
  });

  useEffect(() => {
    fetchPollTypes();
  }, []);

  const fetchPollTypes = async () => {
    try {
      const res = await fetch('/api/admin/poll-types');
      if (res.ok) {
        const data = await res.json();
        setPollTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch poll types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type: PollType) => {
    try {
      const res = await fetch(`/api/admin/poll-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !type.isActive })
      });

      if (res.ok) {
        setPollTypes(pollTypes.map(t =>
          t.id === type.id ? { ...t, isActive: !t.isActive } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle poll type:', error);
    }
  };

  const handleEdit = (type: PollType) => {
    setEditingType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      icon: type.icon || '',
      category: type.category,
      defaultConfig: type.defaultConfig
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingType) {
        const res = await fetch(`/api/admin/poll-types/${editingType.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          setShowModal(false);
          setEditingType(null);
          fetchPollTypes();
        }
      } else {
        const res = await fetch('/api/admin/poll-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          setShowModal(false);
          fetchPollTypes();
        }
      }
    } catch (error) {
      console.error('Failed to save poll type:', error);
    }

    setFormData({
      code: '',
      name: '',
      description: '',
      icon: '',
      category: 'choice',
      defaultConfig: '{}'
    });
  };

  const handleDelete = async (type: PollType) => {
    if (type.isSystem) {
      alert('Cannot delete system poll types');
      return;
    }

    if (type._count.polls > 0) {
      alert(`Cannot delete: ${type._count.polls} polls are using this type`);
      return;
    }

    if (!confirm(`Delete poll type "${type.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/poll-types/${type.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchPollTypes();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete poll type:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="poll-types">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="poll-types">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Poll Types</h1>
            <p className="text-gray-600 mt-1">Manage the types of polls available in your application</p>
          </div>
          <button
            onClick={() => {
              setEditingType(null);
              setFormData({
                code: '',
                name: '',
                description: '',
                icon: '',
                category: 'choice',
                defaultConfig: '{}'
              });
              setShowModal(true);
            }}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 flex items-center gap-2"
          >
            <span>+</span>
            <span>Add Type</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{pollTypes.length}</div>
            <div className="text-gray-600 text-sm">Total Types</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {pollTypes.filter(t => t.isActive).length}
            </div>
            <div className="text-gray-600 text-sm">Active</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {pollTypes.filter(t => t.isSystem).length}
            </div>
            <div className="text-gray-600 text-sm">System Types</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-700">
              {pollTypes.reduce((acc, t) => acc + t._count.polls, 0)}
            </div>
            <div className="text-gray-600 text-sm">Polls Using</div>
          </div>
        </div>

        {/* Poll Types List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">Type</th>
                <th className="text-left p-4 font-medium text-gray-600">Category</th>
                <th className="text-left p-4 font-medium text-gray-600">Polls</th>
                <th className="text-left p-4 font-medium text-gray-600">Templates</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-right p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pollTypes.map((type) => (
                <tr key={type.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon || '📋'}</span>
                      <div>
                        <div className="font-medium text-gray-800">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.code}</div>
                        {type.description && (
                          <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[type.category] || 'bg-gray-100 text-gray-800'}`}>
                      {type.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{type._count.polls}</td>
                  <td className="p-4 text-gray-600">{type._count.templates}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={type.isActive}
                          onChange={() => handleToggle(type)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
                      </label>
                      {type.isSystem && (
                        <span className="text-xs text-gray-400">System</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-green-700 hover:text-green-800 mr-3"
                    >
                      Edit
                    </button>
                    {!type.isSystem && (
                      <button
                        onClick={() => handleDelete(type)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingType ? 'Edit Poll Type' : 'Create Poll Type'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., my_custom_type"
                    required
                    disabled={editingType?.isSystem}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., My Custom Type"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Brief description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., 📊"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="choice">Choice</option>
                      <option value="rating">Rating</option>
                      <option value="ranking">Ranking</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Config (JSON)</label>
                  <textarea
                    value={formData.defaultConfig}
                    onChange={(e) => setFormData({ ...formData, defaultConfig: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                    rows={4}
                    placeholder="{}"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingType(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                  >
                    {editingType ? 'Save Changes' : 'Create Type'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
