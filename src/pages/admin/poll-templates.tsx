import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

interface PollType {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  category: string;
}

interface PollTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  pollTypeId: string;
  pollType: PollType;
  defaultTitle: string | null;
  defaultDescription: string | null;
  defaultOptions: string;
  defaultConfig: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

const categoryColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-800',
  feedback: 'bg-blue-100 text-blue-800',
  events: 'bg-green-100 text-green-800',
  contests: 'bg-green-100 text-green-800'
};

export default function PollTemplatesPage() {
  const [templates, setTemplates] = useState<PollTemplate[]>([]);
  const [pollTypes, setPollTypes] = useState<PollType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PollTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    category: 'general',
    pollTypeId: '',
    defaultTitle: '',
    defaultDescription: '',
    defaultOptions: '[]',
    defaultConfig: '{}'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, typesRes] = await Promise.all([
        fetch('/api/admin/poll-templates'),
        fetch('/api/admin/poll-types')
      ]);

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data);
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        setPollTypes(data.filter((t: any) => t.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (template: PollTemplate) => {
    try {
      const res = await fetch(`/api/admin/poll-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive })
      });

      if (res.ok) {
        setTemplates(templates.map(t =>
          t.id === template.id ? { ...t, isActive: !t.isActive } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleEdit = (template: PollTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      icon: template.icon || '',
      category: template.category || 'general',
      pollTypeId: template.pollTypeId,
      defaultTitle: template.defaultTitle || '',
      defaultDescription: template.defaultDescription || '',
      defaultOptions: template.defaultOptions,
      defaultConfig: template.defaultConfig
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const res = await fetch(`/api/admin/poll-templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          setShowModal(false);
          setEditingTemplate(null);
          fetchData();
        }
      } else {
        const res = await fetch('/api/admin/poll-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          setShowModal(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }

    resetForm();
  };

  const handleDelete = async (template: PollTemplate) => {
    if (template.isSystem) {
      alert('Cannot delete system templates');
      return;
    }

    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/poll-templates/${template.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicate = async (template: PollTemplate) => {
    try {
      const res = await fetch('/api/admin/poll-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          icon: template.icon,
          category: template.category,
          pollTypeId: template.pollTypeId,
          defaultTitle: template.defaultTitle,
          defaultDescription: template.defaultDescription,
          defaultOptions: template.defaultOptions,
          defaultConfig: template.defaultConfig
        })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      category: 'general',
      pollTypeId: pollTypes[0]?.id || '',
      defaultTitle: '',
      defaultDescription: '',
      defaultOptions: '[]',
      defaultConfig: '{}'
    });
  };

  if (loading) {
    return (
      <AdminLayout active="poll-templates">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </AdminLayout>
    );
  }

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const cat = template.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, PollTemplate[]>);

  return (
    <AdminLayout active="poll-templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Poll Templates</h1>
            <p className="text-gray-600 mt-1">Pre-configured poll setups for quick creation</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              resetForm();
              if (pollTypes.length > 0) {
                setFormData(prev => ({ ...prev, pollTypeId: pollTypes[0].id }));
              }
              setShowModal(true);
            }}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 flex items-center gap-2"
          >
            <span>+</span>
            <span>Add Template</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{templates.length}</div>
            <div className="text-gray-600 text-sm">Total Templates</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.isActive).length}
            </div>
            <div className="text-gray-600 text-sm">Active</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {templates.filter(t => t.isSystem).length}
            </div>
            <div className="text-gray-600 text-sm">System Templates</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-700">
              {Object.keys(groupedTemplates).length}
            </div>
            <div className="text-gray-600 text-sm">Categories</div>
          </div>
        </div>

        {/* Templates by Category */}
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 capitalize flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${categoryColors[category] || 'bg-gray-100'}`}>
                {category}
              </span>
              <span className="text-gray-400 text-sm font-normal">
                ({categoryTemplates.length} templates)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all ${
                    template.isActive ? 'border-transparent hover:border-green-200' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{template.icon || '📋'}</span>
                      <div>
                        <div className="font-medium text-gray-800">{template.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <span>{template.pollType?.icon}</span>
                          <span>{template.pollType?.name}</span>
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={template.isActive}
                        onChange={() => handleToggle(template)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-700"></div>
                    </label>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-2">{template.description}</p>
                  )}
                  {template.defaultTitle && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      Default: "{template.defaultTitle}"
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-sm text-green-700 hover:text-green-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Duplicate
                    </button>
                    {!template.isSystem && (
                      <button
                        onClick={() => handleDelete(template)}
                        className="text-sm text-red-600 hover:text-red-800 ml-auto"
                      >
                        Delete
                      </button>
                    )}
                    {template.isSystem && (
                      <span className="text-xs text-gray-400 ml-auto">System</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📑</div>
            <div className="text-gray-600">No templates yet</div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 text-green-700 hover:text-green-800"
            >
              Create your first template
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Template name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., 📊"
                    />
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Poll Type</label>
                    <select
                      value={formData.pollTypeId}
                      onChange={(e) => setFormData({ ...formData, pollTypeId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Select a type</option>
                      {pollTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="general">General</option>
                      <option value="feedback">Feedback</option>
                      <option value="events">Events</option>
                      <option value="contests">Contests</option>
                    </select>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Default Values</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Title</label>
                      <input
                        type="text"
                        value={formData.defaultTitle}
                        onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Pre-filled poll title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Description</label>
                      <input
                        type="text"
                        value={formData.defaultDescription}
                        onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Pre-filled description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Options (JSON array)</label>
                      <textarea
                        value={formData.defaultOptions}
                        onChange={(e) => setFormData({ ...formData, defaultOptions: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                        rows={2}
                        placeholder='["Option 1", "Option 2"]'
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Config Overrides (JSON)</label>
                      <textarea
                        value={formData.defaultConfig}
                        onChange={(e) => setFormData({ ...formData, defaultConfig: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                        rows={3}
                        placeholder='{}'
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                  >
                    {editingTemplate ? 'Save Changes' : 'Create Template'}
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
