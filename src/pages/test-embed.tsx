import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSettings } from '@/hooks/useSettings';

interface Poll {
  id: string;
  title: string;
}

export default function TestEmbedPage() {
  const { settings } = useSettings();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showResults, setShowResults] = useState(true);
  const [allowVote, setAllowVote] = useState(true);
  const [embedKey, setEmbedKey] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'iframe' | 'widget' | 'qr' | 'api'>('iframe');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch('/api/admin/polls');
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
        if (data.length > 0) {
          setSelectedPoll(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    }
  };

  const embedUrl = selectedPoll
    ? `${baseUrl}/embed/polls/${selectedPoll}?theme=${theme}&showResults=${showResults}&allowVote=${allowVote}`
    : '';

  const shareUrl = selectedPoll ? `${baseUrl}/polls/${selectedPoll}` : '';
  const qrCodeUrl = selectedPoll ? `${baseUrl}/api/polls/${selectedPoll}/qrcode?size=200` : '';
  const previewImageUrl = selectedPoll ? `${baseUrl}/api/polls/${selectedPoll}/preview.png` : '';
  const oembedUrl = selectedPoll ? `${baseUrl}/api/oembed?url=${encodeURIComponent(shareUrl)}` : '';

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="450"
  frameborder="0"
  style="border-radius: 12px; max-width: 500px; border: 1px solid #e5e7eb;">
</iframe>`;

  const widgetCode = `<div id="mypollingapp-${selectedPoll}"></div>
<script src="${baseUrl}/widget.js"></script>
<script>
  MyPollingApp.render({
    container: '#mypollingapp-${selectedPoll}',
    pollId: '${selectedPoll}',
    theme: '${theme}'
  });
</script>`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const refreshEmbed = () => {
    setEmbedKey(prev => prev + 1);
  };

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Vote on this poll!')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  return (
    <>
      <Head>
        <title>Embed Test Page - {settings.businessName}</title>
      </Head>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6">
            <h1 className="text-2xl font-bold text-yellow-800">Embed Test Page (Phase 3)</h1>
            <p className="text-yellow-700">Test all embedding features: iFrame, JavaScript Widget, QR Code, oEmbed, Preview Images</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls Column */}
            <div className="space-y-6">
              {/* Poll Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Select Poll</h2>
                <select
                  value={selectedPoll}
                  onChange={(e) => setSelectedPoll(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {polls.map(poll => (
                    <option key={poll.id} value={poll.id}>{poll.title}</option>
                  ))}
                </select>
              </div>

              {/* Embed Options */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Options</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTheme('light')}
                        className={`px-4 py-2 rounded-lg border-2 ${theme === 'light' ? 'border-green-700 bg-green-50' : 'border-gray-200'}`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`px-4 py-2 rounded-lg border-2 ${theme === 'dark' ? 'border-green-700 bg-green-50' : 'border-gray-200'}`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showResults"
                      checked={showResults}
                      onChange={(e) => setShowResults(e.target.checked)}
                      className="w-4 h-4 text-green-700"
                    />
                    <label htmlFor="showResults" className="text-sm text-gray-700">Show results after voting</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowVote"
                      checked={allowVote}
                      onChange={(e) => setAllowVote(e.target.checked)}
                      className="w-4 h-4 text-green-700"
                    />
                    <label htmlFor="allowVote" className="text-sm text-gray-700">Allow voting</label>
                  </div>

                  <button
                    onClick={refreshEmbed}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Refresh Preview
                  </button>
                </div>
              </div>

              {/* Share Links */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Share Links</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Poll URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      />
                      <button
                        onClick={() => copyToClipboard(shareUrl, 'url')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${copied === 'url' ? 'bg-green-500 text-white' : 'bg-green-700 text-white hover:bg-green-800'}`}
                      >
                        {copied === 'url' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Facebook</a>
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-black text-white rounded text-xs hover:bg-gray-800">X/Twitter</a>
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs hover:bg-blue-800">LinkedIn</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="flex border-b">
                  {[
                    { id: 'iframe', label: 'iFrame Embed' },
                    { id: 'widget', label: 'JS Widget' },
                    { id: 'qr', label: 'QR Code' },
                    { id: 'api', label: 'APIs' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-green-700 border-b-2 border-green-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* iFrame Tab */}
                  {activeTab === 'iframe' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">iFrame Embed Code</label>
                        <div className="relative">
                          <textarea
                            readOnly
                            value={iframeCode}
                            rows={6}
                            className="w-full px-4 py-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono"
                          />
                          <button
                            onClick={() => copyToClipboard(iframeCode, 'iframe')}
                            className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium ${copied === 'iframe' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                          >
                            {copied === 'iframe' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Works with WordPress, Joomla, Squarespace, Wix, and any HTML page.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Live Preview</label>
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          {selectedPoll && (
                            <iframe
                              key={embedKey}
                              src={embedUrl}
                              width="100%"
                              height="450"
                              frameBorder="0"
                              style={{ borderRadius: '12px', maxWidth: '500px', border: '1px solid #e5e7eb' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Widget Tab */}
                  {activeTab === 'widget' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">JavaScript Widget Code</label>
                        <div className="relative">
                          <textarea
                            readOnly
                            value={widgetCode}
                            rows={9}
                            className="w-full px-4 py-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono"
                          />
                          <button
                            onClick={() => copyToClipboard(widgetCode, 'widget')}
                            className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium ${copied === 'widget' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                          >
                            {copied === 'widget' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Renders natively in your page without iframes. Supports: theme, showResults, allowVote, onVote callback.</p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Widget Options</h4>
                        <pre className="text-xs text-blue-700 whitespace-pre-wrap">{`MyPollingApp.render({
  container: '#element-id',  // Required: CSS selector or DOM element
  pollId: 'poll-id',         // Required: Poll ID
  theme: 'light',            // 'light' or 'dark'
  showResults: true,         // Show results after voting
  allowVote: true,           // Allow voting
  onVote: (id, text) => {}   // Callback after voting
});`}</pre>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        <p className="text-sm text-gray-500 text-center mb-4">Widget preview would render here when loaded on an external page</p>
                        <p className="text-xs text-gray-400 text-center">The widget loads the poll data via API and renders it dynamically</p>
                      </div>
                    </div>
                  )}

                  {/* QR Code Tab */}
                  {activeTab === 'qr' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code Preview</label>
                          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                            {selectedPoll && (
                              <img
                                key={`qr-${embedKey}`}
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="mx-auto bg-white"
                              />
                            )}
                            <p className="text-sm text-gray-600 mt-4">Scan to vote!</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code API</label>
                            <code className="block text-xs bg-gray-100 p-3 rounded-lg text-green-700 break-all">
                              GET /api/polls/{'{id}'}/qrcode
                            </code>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li><strong>size</strong>: 100-1000 (default: 300)</li>
                              <li><strong>format</strong>: png or svg (default: png)</li>
                              <li><strong>dark</strong>: Dark color hex (default: #000000)</li>
                              <li><strong>light</strong>: Light color hex (default: #ffffff)</li>
                            </ul>
                          </div>

                          <div className="flex gap-2">
                            <a
                              href={`/api/polls/${selectedPoll}/qrcode?size=400`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800"
                            >
                              Download PNG
                            </a>
                            <a
                              href={`/api/polls/${selectedPoll}/qrcode?format=svg&size=400`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                            >
                              Download SVG
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Instagram Sharing Tip</h4>
                        <p className="text-sm text-green-700">Download the QR code and add it to your Instagram Story. Followers can scan to vote directly!</p>
                      </div>
                    </div>
                  )}

                  {/* APIs Tab */}
                  {activeTab === 'api' && (
                    <div className="space-y-4">
                      {/* oEmbed */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">oEmbed Endpoint (WordPress)</span>
                          <a
                            href={oembedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Test
                          </a>
                        </div>
                        <code className="text-xs text-green-700 break-all block">{oembedUrl}</code>
                        <p className="text-xs text-gray-500 mt-2">WordPress automatically discovers oEmbed. Just paste the poll URL in the editor!</p>
                      </div>

                      {/* JSON API */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">JSON API Endpoint</span>
                          <a
                            href={`/api/polls/${selectedPoll}/embed`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Test
                          </a>
                        </div>
                        <code className="text-xs text-green-700 break-all">GET {baseUrl}/api/polls/{selectedPoll}/embed</code>
                        <p className="text-xs text-gray-500 mt-2">Returns poll data as JSON for custom integrations.</p>
                      </div>

                      {/* Preview Image */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Preview Image (Social Media)</span>
                          <a
                            href={previewImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            View
                          </a>
                        </div>
                        <code className="text-xs text-green-700 break-all">GET {baseUrl}/api/polls/{selectedPoll}/preview.png</code>
                        <p className="text-xs text-gray-500 mt-2">Auto-generated image for rich social media previews (1200x630 SVG).</p>
                      </div>

                      {/* QR Code API */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">QR Code API</span>
                          <a
                            href={`/api/polls/${selectedPoll}/qrcode?size=300`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            View
                          </a>
                        </div>
                        <code className="text-xs text-green-700 break-all">GET {baseUrl}/api/polls/{selectedPoll}/qrcode?size=300&format=png</code>
                        <p className="text-xs text-gray-500 mt-2">Parameters: size (100-1000), format (png/svg), dark, light</p>
                      </div>

                      {/* Preview Image Display */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Preview Image Preview</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          {selectedPoll && (
                            <img
                              key={`preview-${embedKey}`}
                              src={previewImageUrl}
                              alt="Social Media Preview"
                              className="w-full"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">This image appears when sharing on Facebook, Twitter, LinkedIn, etc.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulated External Site */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Simulated WordPress/Joomla Page</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="prose max-w-none">
                    <h3 className="text-xl font-serif text-gray-800 mb-2">My Blog Post Title</h3>
                    <p className="text-gray-600 mb-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Here's an embedded poll from {settings.businessName}:
                    </p>

                    <div className="my-6 flex justify-center">
                      {selectedPoll && (
                        <iframe
                          key={`sim-${embedKey}`}
                          src={embedUrl}
                          width="100%"
                          height="450"
                          frameBorder="0"
                          style={{ borderRadius: '12px', maxWidth: '500px', border: '1px solid #e5e7eb' }}
                        />
                      )}
                    </div>

                    <p className="text-gray-600">
                      What do you think? Leave a comment below!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Test Links</h2>
            <div className="flex flex-wrap gap-3">
              <a href="/polls" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                Public Polls Page
              </a>
              <a href="/admin/polls" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                Admin Polls
              </a>
              <a href={shareUrl} target="_blank" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                Open Selected Poll
              </a>
              <a href={embedUrl} target="_blank" className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                Open Embed Page
              </a>
              <a href={previewImageUrl} target="_blank" className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
                Preview Image
              </a>
              <a href={qrCodeUrl} target="_blank" className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200">
                QR Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
