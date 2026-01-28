import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';

interface Stats {
  totalPolls: number;
  totalVotes: number;
  totalUsers: number;
  activePolls: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPolls: 0,
    totalVotes: 0,
    totalUsers: 0,
    activePolls: 0
  });

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <AdminLayout active="dashboard">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
              🗳️
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Polls</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalPolls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Votes</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalVotes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Polls</p>
              <p className="text-2xl font-bold text-gray-800">{stats.activePolls}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a href="/admin/polls" className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition">
            + Create Poll
          </a>
          <a href="/admin/ai-providers" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Configure AI
          </a>
          <a href="/admin/webhooks" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Setup Webhooks
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Database</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">OpenAI Whisper</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Ready</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Hugging Face</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Ready</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
