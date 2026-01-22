import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

export default function GreetingPage() {
  const { settings } = useSettings();
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchGreeting();
  }, []);

  const fetchGreeting = async () => {
    try {
      const res = await fetch('/api/admin/greeting');
      if (res.ok) {
        const data = await res.json();
        setGreeting(data.greeting || '');
      }
    } catch (error) {
      console.error('Failed to fetch greeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!greeting.trim()) {
      showToast('Please enter a greeting message', 'danger');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ greeting: greeting.trim() })
      });

      if (res.ok) {
        showToast('Greeting saved successfully!');
      } else {
        showToast('Failed to save greeting', 'danger');
      }
    } catch (error) {
      showToast('Error saving greeting', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const previewGreeting = () => {
    if (!greeting.trim()) {
      showToast('Please enter a greeting message first', 'warning');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(greeting);

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    showToast('Playing preview...', 'info');
  };

  const stopPreview = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const useExample = (text: string) => {
    setGreeting(text);
    showToast('Example loaded! Remember to save.', 'info');
  };

  const exampleGreetings = [
    {
      mode: 'Professional',
      text: `Welcome to ${settings.businessName}! I'm your AI polling assistant. I can help you create polls, analyze voting results, and gather valuable feedback from your audience. What would you like to do today?`
    },
    {
      mode: 'Friendly',
      text: `Hey there! Great to see you. I'm here to help make polling easy and fun. Whether you need to create a quick vote, check on results, or get insights from your data, I've got you covered. How can I help?`
    },
    {
      mode: 'Concise',
      text: `Hi! I'm your ${settings.businessName} assistant. Ready to help with polls, votes, and feedback. What do you need?`
    }
  ];

  if (loading) {
    return (
      <AdminLayout active="greeting">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="greeting">
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
        }
        .toast {
          padding: 12px 20px;
          border-radius: 8px;
          color: white;
          animation: slideIn 0.3s ease;
        }
        .toast.success { background: #10b981; }
        .toast.danger { background: #ef4444; }
        .toast.warning { background: #f59e0b; }
        .toast.info { background: #3b82f6; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        <span className="text-blue-600 mr-2">💬</span>
        Greeting Configuration
      </h2>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* Welcome Greeting Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-3">
          <h5 className="font-semibold flex items-center gap-2">
            <span>📢</span> Welcome Greeting
          </h5>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure the greeting message that users hear when they start interacting with the AI assistant.
            This message is spoken at the start of each session.
          </p>

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Greeting Message
              </label>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter the greeting message..."
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This message will be spoken exactly as written. Keep it friendly and professional.
              </p>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span> Save Greeting
                  </>
                )}
              </button>

              <div className="flex gap-2">
                {!isPlaying ? (
                  <button
                    type="button"
                    onClick={previewGreeting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    <span>▶️</span> Preview (TTS)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopPreview}
                    className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    <span>⏹️</span> Stop
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              {isPlaying ? '🔊 Playing...' : '🎙️ Ready - uses browser text-to-speech'}
            </p>
          </form>
        </div>
      </div>

      {/* Tips Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-cyan-500 text-white px-6 py-3">
          <h5 className="font-semibold flex items-center gap-2">
            <span>💡</span> Tips for a Good Greeting
          </h5>
        </div>
        <div className="p-6">
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Keep it friendly:</strong> Start with a warm, welcoming tone to set the mood.</li>
            <li><strong>Be helpful:</strong> Mention that you're here to help with polls and feedback.</li>
            <li><strong>Add personality:</strong> A little warmth goes a long way!</li>
            <li><strong>Keep it brief:</strong> Under 400 characters is ideal for a smooth start.</li>
            <li><strong>Avoid special characters:</strong> Stick to plain text for best voice synthesis.</li>
          </ul>
        </div>
      </div>

      {/* Example Greetings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-3">
          <h5 className="font-semibold flex items-center gap-2">
            <span>📝</span> Example Greetings
          </h5>
        </div>
        <div className="p-6 space-y-4">
          {exampleGreetings.map((example, index) => (
            <div key={index} className={index > 0 ? 'pt-4 border-t border-gray-200 dark:border-gray-700' : ''}>
              <strong className="text-gray-800 dark:text-white">{example.mode} Mode:</strong>
              <p className="text-gray-600 dark:text-gray-400 my-2">"{example.text}"</p>
              <button
                type="button"
                onClick={() => useExample(example.text)}
                className="px-3 py-1 text-sm border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              >
                Use This
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Character Count */}
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        Character count: <span className={greeting.length > 400 ? 'text-amber-500 font-medium' : ''}>{greeting.length}</span> / Recommended: under 400 characters
      </div>
    </AdminLayout>
  );
}
