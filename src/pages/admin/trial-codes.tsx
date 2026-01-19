import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface TrialCode {
  id: string;
  code: string;
  requesterFirstName: string;
  requesterLastName: string;
  requesterEmail: string;
  requesterOrganization: string | null;
  status: string;
  expiresAt: string;
}

interface Stats {
  pending: number;
  sent: number;
  redeemed: number;
  expired: number;
  total: number;
}

export default function TrialCodesPage() {
  const [trialCodes, setTrialCodes] = useState<TrialCode[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, sent: 0, redeemed: 0, expired: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    deliveryMethod: 'email',
    durationDays: 14,
  });

  useEffect(() => {
    fetchTrialCodes();
  }, []);

  const fetchTrialCodes = async () => {
    try {
      const res = await fetch('/api/admin/trial-codes');
      const data = await res.json();
      if (data.success) {
        setTrialCodes(data.trialCodes);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching trial codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/trial-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          organization: '',
          deliveryMethod: 'email',
          durationDays: 14,
        });
        fetchTrialCodes();
      } else {
        alert(data.error || 'Failed to create trial code');
      }
    } catch (err) {
      alert('Error creating trial code');
    }
  };

  const handleExtend = async (id: string) => {
    if (!confirm('Extend this trial code by 14 days?')) return;
    try {
      const res = await fetch(`/api/admin/trial-codes/${id}/extend`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchTrialCodes();
      } else {
        alert(data.error || 'Failed to extend');
      }
    } catch (err) {
      alert('Error extending trial code');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this trial code? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/trial-codes/${id}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchTrialCodes();
      } else {
        alert(data.error || 'Failed to revoke');
      }
    } catch (err) {
      alert('Error revoking trial code');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      redeemed: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout active="trial-codes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">Trial Codes</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Trial Code
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold dark:text-white">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sent</p>
            <p className="text-2xl font-bold dark:text-white">{stats.sent}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Redeemed</p>
            <p className="text-2xl font-bold dark:text-white">{stats.redeemed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-gray-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
            <p className="text-2xl font-bold dark:text-white">{stats.expired}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Requester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : trialCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No trial codes found</td>
                </tr>
              ) : (
                trialCodes.map((tc) => (
                  <tr key={tc.id}>
                    <td className="px-6 py-4 font-mono text-sm dark:text-white">{tc.code}</td>
                    <td className="px-6 py-4 dark:text-white">{tc.requesterFirstName} {tc.requesterLastName}</td>
                    <td className="px-6 py-4 dark:text-white">{tc.requesterEmail}</td>
                    <td className="px-6 py-4 dark:text-white">{tc.requesterOrganization || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(tc.status)}`}>
                        {tc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 dark:text-white">{new Date(tc.expiresAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 space-x-2">
                      {tc.status !== 'revoked' && tc.status !== 'redeemed' && (
                        <>
                          <button
                            onClick={() => handleExtend(tc.id)}
                            className="text-blue-600 hover:underline"
                          >
                            Extend
                          </button>
                          <button
                            onClick={() => handleRevoke(tc.id)}
                            className="text-red-600 hover:underline"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Create Trial Code</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-white">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-white">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-white">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-white">Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-white">Delivery Method</label>
                    <select
                      value={formData.deliveryMethod}
                      onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                      className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                      className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create & Send
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
