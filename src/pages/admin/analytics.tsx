import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';

interface Analytics {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalVotes: number;
    totalPolls: number;
    totalUsers: number;
    avgVotesPerDay: number;
    avgPollsPerDay: number;
  };
  trends: {
    votes: { date: string; votes: number }[];
    polls: { date: string; polls: number }[];
    users: { date: string; users: number }[];
  };
  distributions: {
    pollTypes: { type: string; count: number }[];
    plans: { plan: string; count: number }[];
  };
  topPolls: {
    id: string;
    title: string;
    type: string;
    votes: number;
    status: string;
  }[];
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [days]);

  const maxVotes = analytics ? Math.max(...analytics.trends.votes.map(v => v.votes), 1) : 1;
  const maxPolls = analytics ? Math.max(...analytics.trends.polls.map(p => p.polls), 1) : 1;

  const planColors: Record<string, string> = {
    FREE: 'bg-gray-500',
    STARTER: 'bg-blue-500',
    PROFESSIONAL: 'bg-purple-500',
    ENTERPRISE: 'bg-yellow-500'
  };

  const typeColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500'];

  return (
    <AdminLayout active="analytics">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg transition ${
                days === d
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Votes ({days}d)</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.summary.totalVotes}</p>
              <p className="text-xs text-gray-400 mt-1">{analytics.summary.avgVotesPerDay}/day avg</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Polls Created</p>
              <p className="text-3xl font-bold text-blue-600">{analytics.summary.totalPolls}</p>
              <p className="text-xs text-gray-400 mt-1">{analytics.summary.avgPollsPerDay}/day avg</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">New Users</p>
              <p className="text-3xl font-bold text-green-600">{analytics.summary.totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Poll Types</p>
              <p className="text-3xl font-bold text-yellow-600">{analytics.distributions.pollTypes.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Top Poll Votes</p>
              <p className="text-3xl font-bold text-red-600">
                {analytics.topPolls[0]?.votes || 0}
              </p>
            </div>
          </div>

          {/* Vote Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Vote Trend</h2>
            <div className="h-48 flex items-end gap-1">
              {analytics.trends.votes.slice(-30).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-500 rounded-t hover:bg-purple-600 transition cursor-pointer group relative"
                  style={{ height: `${(v.votes / maxVotes) * 100}%`, minHeight: v.votes > 0 ? '4px' : '0' }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {v.date}: {v.votes} votes
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{analytics.trends.votes.slice(-30)[0]?.date}</span>
              <span>{analytics.trends.votes.slice(-1)[0]?.date}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Poll Type Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Poll Type Distribution</h2>
              <div className="space-y-3">
                {analytics.distributions.pollTypes.map((pt, i) => {
                  const total = analytics.distributions.pollTypes.reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? (pt.count / total) * 100 : 0;
                  return (
                    <div key={pt.type} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-600 truncate">{pt.type}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full ${typeColors[i % typeColors.length]} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">{pt.count} ({Math.round(pct)}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Subscription Plans</h2>
              <div className="space-y-3">
                {analytics.distributions.plans.map(p => {
                  const total = analytics.distributions.plans.reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? (p.count / total) * 100 : 0;
                  return (
                    <div key={p.plan} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-gray-600">{p.plan}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full ${planColors[p.plan] || 'bg-gray-500'} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">{p.count} ({Math.round(pct)}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Polls */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Polls by Votes</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Votes</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {analytics.topPolls.map((poll, i) => (
                    <tr key={poll.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 text-gray-400">{i + 1}</td>
                      <td className="py-3 font-medium">{poll.title}</td>
                      <td className="py-3">{poll.type}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          poll.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {poll.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-purple-600">{poll.votes}</td>
                      <td className="py-3 text-right">
                        <a
                          href={`/polls/${poll.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                        <span className="mx-2 text-gray-300">|</span>
                        <a
                          href={`/api/admin/polls/${poll.id}/export?format=csv`}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Export
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-12">Failed to load analytics</div>
      )}
    </AdminLayout>
  );
}
