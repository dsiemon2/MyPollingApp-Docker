import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  kbDocCount: number;
}

interface AIConfig {
  voiceId: string;
  enableRealtime: boolean;
  tutoringStyle: string;
}

const maleVoices = [
  { id: 'ash', name: 'Ash', desc: 'Confident & authoritative', detail: 'Great for presentations', color: '#2c3e50' },
  { id: 'echo', name: 'Echo', desc: 'Calm & reassuring', detail: 'Perfect for support', color: '#1a5276' },
  { id: 'verse', name: 'Verse', desc: 'Dynamic & engaging', detail: 'Keeps users interested', color: '#6f42c1' }
];

const femaleVoices = [
  { id: 'alloy', name: 'Alloy', desc: 'Neutral & balanced', detail: 'Works for all contexts', color: '#6c757d' },
  { id: 'coral', name: 'Coral', desc: 'Friendly & encouraging', detail: 'Great for engagement', color: '#fd7e14' },
  { id: 'sage', name: 'Sage', desc: 'Wise & professional', detail: 'Perfect for business', color: '#198754' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Bright & energetic', detail: 'Keeps energy up', color: '#0dcaf0' },
  { id: 'nova', name: 'Nova', desc: 'Warm & patient', detail: 'Best for guidance', color: '#d63384' }
];

export default function VoicesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [totalKbDocuments, setTotalKbDocuments] = useState(0);
  const [aiConfig, setAiConfig] = useState<AIConfig>({ voiceId: 'alloy', enableRealtime: true, tutoringStyle: 'balanced' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [voicesRes, configRes] = await Promise.all([
        fetch('/api/admin/voices'),
        fetch('/api/admin/ai-config')
      ]);

      if (voicesRes.ok) {
        const data = await voicesRes.json();
        setLanguages(data.languages || []);
        setTotalKbDocuments(data.totalKbDocuments || 0);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.voiceId) {
          setAiConfig(prev => ({ ...prev, voiceId: configData.voiceId }));
        }
        if (configData.enableRealtime !== undefined) {
          setAiConfig(prev => ({ ...prev, enableRealtime: configData.enableRealtime }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const selectMode = async (mode: string) => {
    const enableRealtime = mode === 'realtime' || mode === 'hybrid';
    setAiConfig(prev => ({ ...prev, enableRealtime }));

    try {
      await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableRealtime })
      });
      showToast(`Mode changed to ${mode}`);
    } catch (err) {
      showToast('Failed to update mode', 'danger');
    }
  };

  const selectStyle = async (style: string) => {
    setAiConfig(prev => ({ ...prev, tutoringStyle: style }));
    showToast(`Style set to ${style}`);
  };

  const selectVoice = async (voiceId: string) => {
    setAiConfig(prev => ({ ...prev, voiceId }));

    try {
      await fetch('/api/admin/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedVoice: voiceId })
      });
      showToast(`Voice changed to ${voiceId}`);
    } catch (err) {
      showToast('Failed to update voice', 'danger');
    }
  };

  const previewVoice = (voiceId: string) => {
    const utterance = new SpeechSynthesisUtterance(`Hello! I'm ${voiceId}, your AI assistant. How can I help you today?`);
    window.speechSynthesis.speak(utterance);
    showToast(`Playing preview for ${voiceId}...`, 'info');
  };

  const toggleLanguage = async (code: string, enabled: boolean) => {
    setLanguages(languages.map(l => l.code === code ? { ...l, enabled } : l));

    try {
      await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, enabled })
      });
      showToast(`Language ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showToast('Failed to update language', 'danger');
    }
  };

  return (
    <AdminLayout active="voices">
      <style jsx>{`
        .voice-card {
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid transparent;
        }
        .voice-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .voice-card.selected {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.25);
        }
        .voice-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin: 0 auto 1rem;
          color: white;
        }
        .voice-card .play-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .voice-card:hover .play-btn {
          opacity: 1;
        }
        .mode-card {
          cursor: pointer;
          transition: all 0.2s;
          border: 3px solid transparent;
        }
        .mode-card:hover {
          border-color: #e5e7eb;
        }
        .mode-card.selected {
          border-color: #0ea5e9;
          background: rgba(14, 165, 233, 0.05);
        }
        .style-btn {
          transition: all 0.2s;
        }
        .style-btn.active {
          transform: scale(1.05);
        }
        .lang-card {
          transition: all 0.2s;
        }
        .lang-card.disabled-lang {
          opacity: 0.5;
        }
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
        .toast.info { background: #3b82f6; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <span className="text-blue-600 mr-2">🔊</span>
        Voices, Languages & Mode
      </h2>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* Interaction Mode Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-cyan-500 text-white px-6 py-3">
          <h5 className="font-semibold flex items-center gap-2">
            <span>↔️</span> Interaction Mode
          </h5>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Choose how the AI assistant will interact with users.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`mode-card rounded-xl p-4 text-center cursor-pointer ${aiConfig.enableRealtime ? 'selected' : 'bg-gray-50'}`}
              onClick={() => selectMode('realtime')}
            >
              <div className="text-5xl mb-3">🎧</div>
              <h4 className="font-semibold text-lg">Voice Mode</h4>
              <p className="text-gray-500 text-sm">Real-time voice conversations. Best for interactive engagement.</p>
              {aiConfig.enableRealtime && (
                <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">✓ Active</span>
              )}
            </div>

            <div
              className={`mode-card rounded-xl p-4 text-center cursor-pointer ${!aiConfig.enableRealtime ? 'selected' : 'bg-gray-50'}`}
              onClick={() => selectMode('text')}
            >
              <div className="text-5xl mb-3">💬</div>
              <h4 className="font-semibold text-lg">Text Mode</h4>
              <p className="text-gray-500 text-sm">Chat-based interaction with text responses. Good for quiet environments.</p>
              {!aiConfig.enableRealtime && (
                <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">✓ Active</span>
              )}
            </div>

            <div
              className="mode-card rounded-xl p-4 text-center cursor-pointer bg-gray-50"
              onClick={() => selectMode('hybrid')}
            >
              <div className="text-5xl mb-3">🔄</div>
              <h4 className="font-semibold text-lg">Hybrid Mode</h4>
              <p className="text-gray-500 text-sm">Users can switch between voice and text during sessions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Style Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-amber-500 text-white px-6 py-3">
          <h5 className="font-semibold flex items-center gap-2">
            <span>⚡</span> Interaction Style
          </h5>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">How should the AI assistant approach interactions?</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              className={`style-btn p-4 rounded-xl border-2 text-center transition ${
                aiConfig.tutoringStyle === 'supportive' ? 'border-green-500 bg-green-50 active' : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => selectStyle('supportive')}
            >
              <div className="text-3xl mb-2">😊</div>
              <strong className="block">Supportive</strong>
              <small className="text-gray-500">Gentle & encouraging</small>
            </button>

            <button
              className={`style-btn p-4 rounded-xl border-2 text-center transition ${
                aiConfig.tutoringStyle === 'balanced' ? 'border-blue-500 bg-blue-50 active' : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => selectStyle('balanced')}
            >
              <div className="text-3xl mb-2">😐</div>
              <strong className="block">Balanced</strong>
              <small className="text-gray-500">Mix of support & directness</small>
            </button>

            <button
              className={`style-btn p-4 rounded-xl border-2 text-center transition ${
                aiConfig.tutoringStyle === 'challenging' ? 'border-amber-500 bg-amber-50 active' : 'border-gray-200 hover:border-amber-300'
              }`}
              onClick={() => selectStyle('challenging')}
            >
              <div className="text-3xl mb-2">🏆</div>
              <strong className="block">Challenging</strong>
              <small className="text-gray-500">Push for better results</small>
            </button>

            <button
              className={`style-btn p-4 rounded-xl border-2 text-center transition ${
                aiConfig.tutoringStyle === 'socratic' ? 'border-red-500 bg-red-50 active' : 'border-gray-200 hover:border-red-300'
              }`}
              onClick={() => selectStyle('socratic')}
            >
              <div className="text-3xl mb-2">💡</div>
              <strong className="block">Socratic</strong>
              <small className="text-gray-500">Questions to guide</small>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Selection Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-3">
          <h5 className="font-semibold flex items-center gap-2">
            <span>👤</span> Select AI Voice
          </h5>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Choose the voice for your AI assistant. Click to select, hover to preview.</p>

          {/* Male Voices */}
          <h6 className="text-gray-500 text-sm font-medium mb-3 flex items-center gap-2">
            <span>♂️</span> Male Voices
          </h6>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {maleVoices.map((voice) => (
              <div
                key={voice.id}
                className={`voice-card rounded-xl p-4 text-center relative ${
                  aiConfig.voiceId === voice.id ? 'selected' : 'bg-gray-50'
                }`}
                onClick={() => selectVoice(voice.id)}
              >
                <button
                  className="play-btn absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
                  onClick={(e) => { e.stopPropagation(); previewVoice(voice.id); }}
                >
                  ▶️
                </button>
                <div className="voice-avatar" style={{ background: voice.color }}>
                  👤
                </div>
                <h5 className="font-semibold text-lg">{voice.name}</h5>
                <span className="inline-block px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded mb-1">American English</span>
                <p className="text-gray-500 text-sm">{voice.desc}</p>
                <p className="text-gray-400 text-xs">{voice.detail}</p>
                {aiConfig.voiceId === voice.id && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">✓ Active</span>
                )}
              </div>
            ))}
          </div>

          {/* Female Voices */}
          <h6 className="text-gray-500 text-sm font-medium mb-3 flex items-center gap-2">
            <span>♀️</span> Female Voices
          </h6>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {femaleVoices.map((voice) => (
              <div
                key={voice.id}
                className={`voice-card rounded-xl p-4 text-center relative ${
                  aiConfig.voiceId === voice.id ? 'selected' : 'bg-gray-50'
                }`}
                onClick={() => selectVoice(voice.id)}
              >
                <button
                  className="play-btn absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
                  onClick={(e) => { e.stopPropagation(); previewVoice(voice.id); }}
                >
                  ▶️
                </button>
                <div className="voice-avatar" style={{ background: voice.color }}>
                  👩
                </div>
                <h5 className="font-semibold text-lg">{voice.name}</h5>
                <span className="inline-block px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded mb-1">American English</span>
                <p className="text-gray-500 text-sm">{voice.desc}</p>
                <p className="text-gray-400 text-xs">{voice.detail}</p>
                {aiConfig.voiceId === voice.id && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">✓ Active</span>
                )}
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h6 className="font-semibold text-blue-800 flex items-center gap-2">
              <span>ℹ️</span> Voice Provider Information
            </h6>
            <p className="text-blue-700 text-sm mt-1">
              These voices are powered by OpenAI's Realtime API. For additional accents (British, Australian, etc.) or custom voice cloning, integration with{' '}
              <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline">ElevenLabs</a> would be required.
            </p>
          </div>
        </div>
      </div>

      {/* Languages Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-3 flex justify-between items-center">
          <h5 className="font-semibold flex items-center gap-2">
            <span>🌐</span> Supported Languages
          </h5>
          <span className="px-2 py-1 bg-white text-green-700 text-xs rounded-full font-medium">
            {languages.filter(l => l.enabled).length} of {languages.length} enabled
          </span>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Enable or disable languages for your AI assistant.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {languages.length > 0 ? (
              languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`lang-card border rounded-lg p-3 flex items-center justify-between ${
                    !lang.enabled ? 'disabled-lang' : ''
                  }`}
                >
                  <div>
                    <strong className="text-gray-800">{lang.name}</strong>
                    <br />
                    <small className="text-gray-500">{lang.nativeName} ({lang.code})</small>
                    <br />
                    <small className="text-blue-600 flex items-center gap-1 mt-1">
                      <span>📄</span> {lang.kbDocCount} KB documents
                    </small>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lang.enabled}
                      onChange={(e) => toggleLanguage(lang.code, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-amber-50 border border-amber-200 rounded-lg p-4">
                <span className="text-amber-700">⚠️ No languages configured. Please run database seed.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl mb-2">↔️</div>
          <h4 className="text-xl font-bold text-gray-800">{aiConfig.enableRealtime ? 'Voice' : 'Text'}</h4>
          <p className="text-gray-500 text-sm">Interaction Mode</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <h4 className="text-xl font-bold text-gray-800 capitalize">{aiConfig.tutoringStyle}</h4>
          <p className="text-gray-500 text-sm">Interaction Style</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl mb-2">🔊</div>
          <h4 className="text-xl font-bold text-gray-800 capitalize">{aiConfig.voiceId}</h4>
          <p className="text-gray-500 text-sm">Current Voice</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl mb-2">🌐</div>
          <h4 className="text-xl font-bold text-gray-800">{languages.filter(l => l.enabled).length}</h4>
          <p className="text-gray-500 text-sm">Active Languages</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl mb-2">📄</div>
          <h4 className="text-xl font-bold text-gray-800">{totalKbDocuments}</h4>
          <p className="text-gray-500 text-sm">KB Documents</p>
        </div>
      </div>
    </AdminLayout>
  );
}
