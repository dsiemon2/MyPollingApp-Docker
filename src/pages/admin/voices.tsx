import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';

interface Voice {
  id: string;
  voiceId: string;
  name: string;
  gender: string;
  description: string;
  provider: string;
  language: string;
  isDefault: boolean;
  enabled: boolean;
}

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  enabled: boolean;
}

const defaultVoices = [
  { voiceId: 'ash', name: 'Ash', gender: 'male', description: 'Confident & authoritative', color: '#2c3e50' },
  { voiceId: 'echo', name: 'Echo', gender: 'male', description: 'Calm & reassuring', color: '#1a5276' },
  { voiceId: 'verse', name: 'Verse', gender: 'male', description: 'Dynamic & engaging', color: '#6f42c1' },
  { voiceId: 'alloy', name: 'Alloy', gender: 'female', description: 'Neutral & balanced', color: '#6c757d' },
  { voiceId: 'ballad', name: 'Ballad', gender: 'female', description: 'Warm & expressive', color: '#d63384' },
  { voiceId: 'coral', name: 'Coral', gender: 'female', description: 'Friendly & upbeat', color: '#fd7e14' },
  { voiceId: 'sage', name: 'Sage', gender: 'female', description: 'Wise & professional', color: '#198754' },
  { voiceId: 'shimmer', name: 'Shimmer', gender: 'female', description: 'Bright & energetic', color: '#0dcaf0' },
];

const defaultLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

export default function VoicesPage() {
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/voices');
      if (res.ok) {
        const data = await res.json();
        setSelectedVoice(data.selectedVoice || 'alloy');
        setLanguages(data.languages || []);
      }
    } catch (error) {
      console.error('Failed to fetch voice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectVoice = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    try {
      await fetch('/api/admin/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedVoice: voiceId })
      });
    } catch (error) {
      console.error('Failed to update voice:', error);
    }
  };

  const toggleLanguage = async (langCode: string, enabled: boolean) => {
    setLanguages(languages.map(l =>
      l.code === langCode ? { ...l, enabled } : l
    ));
    try {
      await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: langCode, enabled })
      });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const maleVoices = defaultVoices.filter(v => v.gender === 'male');
  const femaleVoices = defaultVoices.filter(v => v.gender === 'female');

  return (
    <AdminLayout active="voices">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Voices & Languages</h1>
        <p className="text-gray-600 mt-1">Configure voice settings for AI assistant</p>
      </div>

      {/* Voice Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔊 Select AI Voice</h2>
        <p className="text-gray-600 mb-6">Choose the voice for your AI assistant. Click to select.</p>

        {/* Male Voices */}
        <h3 className="text-sm font-medium text-gray-500 mb-3">Male Voices</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {maleVoices.map((voice) => (
            <div
              key={voice.voiceId}
              onClick={() => selectVoice(voice.voiceId)}
              className={`voice-card p-4 rounded-xl text-center cursor-pointer ${
                selectedVoice === voice.voiceId ? 'selected' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl mb-3"
                style={{ background: voice.color }}
              >
                👤
              </div>
              <h4 className="font-medium text-gray-800">{voice.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{voice.description}</p>
              {selectedVoice === voice.voiceId && (
                <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Active</span>
              )}
            </div>
          ))}
        </div>

        {/* Female Voices */}
        <h3 className="text-sm font-medium text-gray-500 mb-3">Female Voices</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {femaleVoices.map((voice) => (
            <div
              key={voice.voiceId}
              onClick={() => selectVoice(voice.voiceId)}
              className={`voice-card p-4 rounded-xl text-center cursor-pointer ${
                selectedVoice === voice.voiceId ? 'selected' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl mb-3"
                style={{ background: voice.color }}
              >
                👩
              </div>
              <h4 className="font-medium text-gray-800">{voice.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{voice.description}</p>
              {selectedVoice === voice.voiceId && (
                <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Active</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🌐 Supported Languages</h2>
        <p className="text-gray-600 mb-6">Enable or disable languages for voice transcription.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {defaultLanguages.map((lang) => {
            const langData = languages.find(l => l.code === lang.code);
            const isEnabled = langData?.enabled ?? true;

            return (
              <div
                key={lang.code}
                className={`p-4 rounded-xl border-2 transition ${
                  isEnabled ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-medium text-gray-800">{lang.name}</p>
                      <p className="text-xs text-gray-500">{lang.nativeName}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => toggleLanguage(lang.code, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{selectedVoice}</p>
          <p className="text-sm text-gray-500">Current Voice</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{defaultVoices.length}</p>
          <p className="text-sm text-gray-500">Available Voices</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {languages.filter(l => l.enabled).length || defaultLanguages.length}
          </p>
          <p className="text-sm text-gray-500">Active Languages</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">OpenAI</p>
          <p className="text-sm text-gray-500">Voice Provider</p>
        </div>
      </div>
    </AdminLayout>
  );
}
