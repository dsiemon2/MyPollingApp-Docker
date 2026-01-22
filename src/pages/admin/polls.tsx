import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Poll {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  closedAt?: string;
  pollType?: {
    code: string;
    name: string;
    icon: string;
  };
  _count: {
    votes: number;
    options: number;
  };
}

interface PollType {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  defaultConfig: string;
  isActive: boolean;
}

interface PollTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pollTypeId: string;
  pollType: PollType;
  defaultTitle: string;
  defaultDescription: string;
  defaultOptions: string;
  defaultConfig: string;
}

type CreateMode = 'select' | 'scratch' | 'template';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PollManagementPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollTypes, setPollTypes] = useState<PollType[]>([]);
  const [templates, setTemplates] = useState<PollTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('select');
  const [selectedType, setSelectedType] = useState<PollType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PollTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pollTypeId: '',
    options: ['', ''],
    config: {} as Record<string, unknown>,
    enableScheduling: false,
    scheduledAt: '',
    closedAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchPolls(1);
    fetchPollTypes();
    fetchTemplates();
  }, []);

  const fetchPolls = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/polls?page=${page}&limit=${pagination.limit}`);
      if (res.ok) {
        const data = await res.json();
        setPolls(data.polls);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPolls(newPage);
    }
  };

  const fetchPollTypes = async () => {
    try {
      const res = await fetch('/api/admin/poll-types');
      if (res.ok) {
        const data = await res.json();
        setPollTypes(data.filter((t: PollType) => t.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch poll types:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/poll-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.filter((t: PollTemplate) => t.pollType?.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      pollTypeId: '',
      options: ['', ''],
      config: {},
      enableScheduling: false,
      scheduledAt: '',
      closedAt: ''
    });
    setSelectedType(null);
    setSelectedTemplate(null);
    setCreateMode('select');
  };

  const handleTypeSelect = (type: PollType) => {
    setSelectedType(type);
    const defaultConfig = type.defaultConfig ? JSON.parse(type.defaultConfig) : {};
    setFormData({
      ...formData,
      pollTypeId: type.id,
      config: defaultConfig,
      options: needsOptions(type.code) ? ['', ''] : []
    });
  };

  const handleTemplateSelect = (template: PollTemplate) => {
    setSelectedTemplate(template);
    setSelectedType(template.pollType);
    const defaultConfig = template.defaultConfig ? JSON.parse(template.defaultConfig) : {};
    const typeConfig = template.pollType.defaultConfig ? JSON.parse(template.pollType.defaultConfig) : {};
    const defaultOptions = template.defaultOptions ? JSON.parse(template.defaultOptions) : [];

    setFormData({
      title: template.defaultTitle || '',
      description: template.defaultDescription || '',
      pollTypeId: template.pollTypeId,
      options: defaultOptions.length > 0 ? defaultOptions : (needsOptions(template.pollType.code) ? ['', ''] : []),
      config: { ...typeConfig, ...defaultConfig },
      enableScheduling: false,
      scheduledAt: '',
      closedAt: ''
    });
    setCreateMode('scratch'); // Go to form
  };

  const needsOptions = (code: string) => {
    return ['single_choice', 'multiple_choice', 'ranked'].includes(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        pollTypeId: formData.pollTypeId,
        type: selectedType?.code || 'single_choice',
        options: formData.options.filter(o => o.trim()),
        config: formData.config
      };

      // Add scheduling if enabled
      if (formData.enableScheduling) {
        if (formData.scheduledAt) {
          payload.scheduledAt = new Date(formData.scheduledAt).toISOString();
        }
        if (formData.closedAt) {
          payload.closedAt = new Date(formData.closedAt).toISOString();
        }
      }

      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchPolls(pagination.page);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  };

  const closePoll = async (id: string) => {
    try {
      await fetch(`/api/polls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' })
      });
      fetchPolls(pagination.page);
    } catch (error) {
      console.error('Failed to close poll:', error);
    }
  };

  const deletePoll = async (id: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    try {
      await fetch(`/api/polls/${id}`, { method: 'DELETE' });
      fetchPolls(pagination.page);
    } catch (error) {
      console.error('Failed to delete poll:', error);
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({ ...formData, options: [...formData.options, ''] });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateConfig = (key: string, value: unknown) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value }
    });
  };

  const renderTypeConfig = () => {
    if (!selectedType) return null;

    switch (selectedType.code) {
      case 'rating_scale':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Rating Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Rating</label>
                <select
                  value={formData.config.maxRating as number || 5}
                  onChange={(e) => updateConfig('maxRating', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={5}>5 Stars</option>
                  <option value={10}>10 Points</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Style</label>
                <select
                  value={formData.config.style as string || 'stars'}
                  onChange={(e) => updateConfig('style', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="stars">Stars</option>
                  <option value="numbers">Numbers</option>
                  <option value="emoji">Emoji</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Yes/No Options</h4>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.config.allowNeutral as boolean ?? true}
                onChange={(e) => updateConfig('allowNeutral', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Allow "Maybe" option</span>
            </label>
          </div>
        );

      case 'ranked':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Ranked Choice Options</h4>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Rankings</label>
              <select
                value={formData.config.maxRankings as number || 3}
                onChange={(e) => updateConfig('maxRankings', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={2}>Top 2</option>
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
              </select>
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Multiple Choice Options</h4>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Selections (0 = unlimited)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.config.maxSelections as number || 0}
                onChange={(e) => updateConfig('maxSelections', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        );

      case 'open_text':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Text Response Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Length</label>
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={formData.config.maxLength as number || 500}
                  onChange={(e) => updateConfig('maxLength', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Input Type</label>
                <select
                  value={formData.config.multiline as boolean ? 'multiline' : 'single'}
                  onChange={(e) => updateConfig('multiline', e.target.value === 'multiline')}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="multiline">Multi-line</option>
                  <option value="single">Single line</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Placeholder Text</label>
              <input
                type="text"
                value={formData.config.placeholder as string || ''}
                onChange={(e) => updateConfig('placeholder', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter your response..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPollTypeName = (poll: Poll) => {
    if (poll.pollType) {
      return `${poll.pollType.icon || ''} ${poll.pollType.name}`;
    }
    return poll.type === 'multiple' ? 'Multiple Choice' : 'Single Choice';
  };

  return (
    <AdminLayout active="polls">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Poll Management</h1>
          <p className="text-gray-600 mt-1">Create and manage polls</p>
        </div>
        <button
          onClick={() => { setShowModal(true); resetForm(); }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          + Create Poll
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-2xl font-bold text-purple-600">{polls.length}</p>
          <p className="text-sm text-gray-500">Total Polls</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-2xl font-bold text-green-600">{polls.filter(p => p.status === 'open').length}</p>
          <p className="text-sm text-gray-500">Active Polls</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-2xl font-bold text-blue-600">{polls.filter(p => p.status === 'scheduled').length}</p>
          <p className="text-sm text-gray-500">Scheduled</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-2xl font-bold text-indigo-600">{polls.reduce((sum, p) => sum + p._count.votes, 0)}</p>
          <p className="text-sm text-gray-500">Total Votes</p>
        </div>
      </div>

      {/* Polls Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {polls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">🗳️</p>
            <p>No polls created yet.</p>
          </div>
        ) : (
          <>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poll</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {polls.map((poll) => (
                <tr key={poll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{poll.title}</div>
                    {poll.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{poll.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {getPollTypeName(poll)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{poll._count.options}</td>
                  <td className="px-6 py-4 text-gray-600">{poll._count.votes}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      poll.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : poll.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700'
                        : poll.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {poll.status}
                    </span>
                    {poll.scheduledAt && poll.status === 'scheduled' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Opens: {new Date(poll.scheduledAt).toLocaleDateString()}
                      </div>
                    )}
                    {poll.closedAt && poll.status === 'open' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Closes: {new Date(poll.closedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/polls/${poll.id}`} className="text-purple-600 hover:text-purple-800 mr-3">
                      View
                    </Link>
                    {poll.status === 'open' && (
                      <button
                        onClick={() => closePoll(poll.id)}
                        className="text-yellow-600 hover:text-yellow-800 mr-3"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => deletePoll(poll.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} polls
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`px-3 py-1 border rounded text-sm ${
                          p === pagination.page ? 'bg-purple-600 text-white border-purple-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Create Poll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {createMode === 'select' && 'Create New Poll'}
                {createMode === 'scratch' && (selectedType ? `New ${selectedType.name} Poll` : 'Create Poll')}
                {createMode === 'template' && 'Choose a Template'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Mode Selection */}
            {createMode === 'select' && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setCreateMode('scratch')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left"
                  >
                    <div className="text-3xl mb-2">✏️</div>
                    <div className="font-semibold text-gray-800">From Scratch</div>
                    <div className="text-sm text-gray-500">Choose a poll type and customize</div>
                  </button>
                  <button
                    onClick={() => setCreateMode('template')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left"
                  >
                    <div className="text-3xl mb-2">📋</div>
                    <div className="font-semibold text-gray-800">Use Template</div>
                    <div className="text-sm text-gray-500">Start with a pre-configured template</div>
                  </button>
                </div>
              </div>
            )}

            {/* Template Selection */}
            {createMode === 'template' && (
              <div className="p-6">
                <button
                  onClick={() => setCreateMode('select')}
                  className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-1"
                >
                  ← Back
                </button>

                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <span className="font-semibold text-gray-800">{template.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                      <div className="mt-2 text-xs text-purple-600">{template.pollType?.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Poll Type Selection or Form */}
            {createMode === 'scratch' && !selectedType && (
              <div className="p-6">
                <button
                  onClick={() => setCreateMode('select')}
                  className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-1"
                >
                  ← Back
                </button>

                <p className="text-gray-600 mb-4">Choose a poll type:</p>

                <div className="grid grid-cols-2 gap-3">
                  {pollTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type)}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{type.icon}</span>
                        <span className="font-semibold text-gray-800">{type.name}</span>
                      </div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Poll Form */}
            {createMode === 'scratch' && selectedType && (
              <form onSubmit={handleSubmit} className="p-6">
                <button
                  type="button"
                  onClick={() => { setSelectedType(null); setSelectedTemplate(null); }}
                  className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-1"
                >
                  ← Change Type
                </button>

                <div className="flex items-center gap-2 mb-4 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">{selectedType.icon}</span>
                  <div>
                    <div className="font-semibold text-purple-800">{selectedType.name}</div>
                    <div className="text-xs text-purple-600">{selectedType.description}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="What do you want to ask?"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Add more context (optional)"
                    rows={2}
                  />
                </div>

                {/* Scheduling Section */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.enableScheduling}
                      onChange={(e) => setFormData({ ...formData, enableScheduling: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-gray-700">Enable Scheduling</span>
                  </label>

                  {formData.enableScheduling && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Open At (optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to open immediately</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Close At (optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.closedAt}
                          onChange={(e) => setFormData({ ...formData, closedAt: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for manual close</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Type-specific config */}
                {renderTypeConfig()}

                {/* Options for types that need them */}
                {needsOptions(selectedType.code) && (
                  <div className="mb-6 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.options.length < 10 && (
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-purple-600 hover:text-purple-700 text-sm"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create Poll
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
