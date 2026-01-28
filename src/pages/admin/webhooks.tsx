import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  enabled: boolean;
}

const eventTypes = [
  { id: 'poll.created', label: 'Poll Created', category: 'Polls' },
  { id: 'poll.closed', label: 'Poll Closed', category: 'Polls' },
  { id: 'vote.cast', label: 'Vote Cast', category: 'Votes' },
  { id: 'message.sent', label: 'Message Sent', category: 'Chat' },
  { id: 'voice.transcribed', label: 'Voice Transcribed', category: 'Voice' },
  { id: 'ai.response', label: 'AI Response', category: 'AI' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/admin/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (webhook?: Webhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret || '',
        events: webhook.events
      });
    } else {
      setEditingWebhook(null);
      setFormData({ name: '', url: '', secret: '', events: [] });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingWebhook ? 'PUT' : 'POST';
      const url = editingWebhook
        ? `/api/admin/webhooks/${editingWebhook.id}`
        : '/api/admin/webhooks';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to save webhook:', error);
    }
  };

  const toggleWebhook = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/admin/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await fetch(`/api/admin/webhooks/${id}`, { method: 'DELETE' });
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const testWebhook = async (webhook: Webhook) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${webhook.id}/test`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Test webhook sent successfully!');
      } else {
        alert('Failed to send test webhook');
      }
    } catch (error) {
      alert('Failed to send test webhook');
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  return (
    <AdminLayout active="webhooks">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Webhooks</h1>
          <p className="text-gray-600 mt-1">Configure webhooks for external integrations</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
        >
          + Add Webhook
        </button>
      </div>

      {/* Webhooks List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {webhooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">🔗</p>
            <p>No webhooks configured yet.</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-green-700 hover:underline"
            >
              Add your first webhook
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{webhook.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {webhook.url}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 3).map((event) => (
                        <span key={event} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {event}
                        </span>
                      ))}
                      {webhook.events.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{webhook.events.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhook.enabled}
                        onChange={(e) => toggleWebhook(webhook.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => testWebhook(webhook)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => openModal(webhook)}
                      className="text-green-700 hover:text-green-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Event Types Reference */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">📋 Available Event Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {eventTypes.map((event) => (
            <div key={event.id} className="text-sm">
              <code className="text-blue-700">{event.id}</code>
              <span className="text-blue-600 ml-2">- {event.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="My Webhook"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret (optional)</label>
                <input
                  type="text"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Webhook secret for signing payloads"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map((event) => (
                    <label key={event.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="rounded text-green-700"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                >
                  {editingWebhook ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
