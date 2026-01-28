import { useState, useEffect } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
}

export default function ShareModal({ isOpen, onClose, pollId, pollTitle, pollDescription }: ShareModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'share' | 'embed' | 'advanced'>('share');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const pollUrl = `${baseUrl}/polls/${pollId}`;
  const embedUrl = `${baseUrl}/embed/polls/${pollId}`;
  const qrCodeUrl = `${baseUrl}/api/polls/${pollId}/qrcode?size=200`;
  const shareText = `Vote on: ${pollTitle}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="450"
  frameborder="0"
  style="border-radius: 12px; max-width: 500px; border: 1px solid #e5e7eb;">
</iframe>`;

  const widgetCode = `<div id="mypollingapp-${pollId}"></div>
<script src="${baseUrl}/widget.js"></script>
<script>
  MyPollingApp.render({
    container: '#mypollingapp-${pollId}',
    pollId: '${pollId}',
    theme: 'light'
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

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pollUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pollUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Vote on this poll: ${pollTitle}`);
    const body = encodeURIComponent(`Check out this poll!\n\n${pollTitle}\n${pollDescription || ''}\n\nVote here: ${pollUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadQR = () => {
    window.open(`${baseUrl}/api/polls/${pollId}/qrcode?size=400`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Share This Poll</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'share', label: 'Share' },
            { id: 'embed', label: 'Embed' },
            { id: 'advanced', label: 'Advanced' }
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

        <div className="p-5 space-y-5">
          {/* Poll Preview */}
          <div className="bg-green-50 rounded-xl p-4">
            <p className="font-semibold text-green-800">{pollTitle}</p>
            {pollDescription && <p className="text-sm text-green-700 mt-1">{pollDescription}</p>}
          </div>

          {/* Share Tab */}
          {activeTab === 'share' && (
            <>
              {/* Copy Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Poll Link</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={pollUrl} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600" />
                  <button
                    onClick={() => copyToClipboard(pollUrl, 'link')}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${copied === 'link' ? 'bg-green-500 text-white' : 'bg-green-700 text-white hover:bg-green-800'}`}
                  >
                    {copied === 'link' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Share on Social Media</label>
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={shareToFacebook} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl">f</div>
                    <span className="text-xs font-medium text-gray-600">Facebook</span>
                  </button>
                  <button onClick={shareToTwitter} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-lg font-bold">X</div>
                    <span className="text-xs font-medium text-gray-600">X/Twitter</span>
                  </button>
                  <button onClick={shareToLinkedIn} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-lg font-bold">in</div>
                    <span className="text-xs font-medium text-gray-600">LinkedIn</span>
                  </button>
                  <button onClick={shareViaEmail} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl">@</div>
                    <span className="text-xs font-medium text-gray-600">Email</span>
                  </button>
                </div>
              </div>

              {/* QR Code for Instagram */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  QR Code <span className="font-normal text-gray-500">(for Instagram & Mobile)</span>
                </label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 bg-white rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-3">Scan to vote! Perfect for Instagram Stories or printed materials.</p>
                    <div className="flex gap-2">
                      <button onClick={downloadQR} className="px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">Download QR</button>
                      <button
                        onClick={() => copyToClipboard(`${baseUrl}/api/polls/${pollId}/qrcode?size=400`, 'qr')}
                        className={`px-3 py-1.5 text-sm rounded-lg ${copied === 'qr' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {copied === 'qr' ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Embed Tab */}
          {activeTab === 'embed' && (
            <>
              {/* iFrame Embed */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  iFrame Embed <span className="font-normal text-gray-500">(Simple, works everywhere)</span>
                </label>
                <div className="relative">
                  <textarea readOnly value={iframeCode} rows={5} className="w-full px-4 py-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono resize-none" />
                  <button
                    onClick={() => copyToClipboard(iframeCode, 'iframe')}
                    className={`absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-medium ${copied === 'iframe' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {copied === 'iframe' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Works with WordPress, Joomla, Squarespace, Wix, and any HTML page.</p>
              </div>

              {/* JavaScript Widget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  JavaScript Widget <span className="font-normal text-gray-500">(Dynamic, no iframe)</span>
                </label>
                <div className="relative">
                  <textarea readOnly value={widgetCode} rows={7} className="w-full px-4 py-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono resize-none" />
                  <button
                    onClick={() => copyToClipboard(widgetCode, 'widget')}
                    className={`absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-medium ${copied === 'widget' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {copied === 'widget' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Renders natively in your page. Options: theme, showResults, allowVote, onVote callback.</p>
              </div>

              {/* WordPress Instructions */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">WordPress Native Embedding</h4>
                <p className="text-sm text-blue-700 mb-2">Just paste the poll URL directly into WordPress and it will embed automatically (using oEmbed):</p>
                <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded block">{pollUrl}</code>
              </div>
            </>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <>
              {/* API Endpoint */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">JSON API Endpoint</span>
                  <button
                    onClick={() => copyToClipboard(`${baseUrl}/api/polls/${pollId}/embed`, 'api')}
                    className={`text-xs px-2 py-1 rounded ${copied === 'api' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                    {copied === 'api' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <code className="text-xs text-green-700 break-all">GET {baseUrl}/api/polls/{pollId}/embed</code>
                <p className="text-xs text-gray-500 mt-2">Returns poll data as JSON for custom integrations.</p>
              </div>

              {/* oEmbed Endpoint */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">oEmbed Endpoint</span>
                  <button
                    onClick={() => copyToClipboard(`${baseUrl}/api/oembed?url=${encodeURIComponent(pollUrl)}`, 'oembed')}
                    className={`text-xs px-2 py-1 rounded ${copied === 'oembed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                    {copied === 'oembed' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <code className="text-xs text-green-700 break-all">GET {baseUrl}/api/oembed?url=...</code>
                <p className="text-xs text-gray-500 mt-2">For WordPress and other oEmbed-compatible platforms.</p>
              </div>

              {/* Preview Image */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Preview Image (Social Media)</span>
                  <a
                    href={`${baseUrl}/api/polls/${pollId}/preview.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    View
                  </a>
                </div>
                <code className="text-xs text-green-700 break-all">{baseUrl}/api/polls/{pollId}/preview.png</code>
                <p className="text-xs text-gray-500 mt-2">Auto-generated image for rich social media previews.</p>
              </div>

              {/* QR Code API */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">QR Code API</span>
                  <a
                    href={`${baseUrl}/api/polls/${pollId}/qrcode?size=300`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    View
                  </a>
                </div>
                <code className="text-xs text-green-700 break-all">{baseUrl}/api/polls/{pollId}/qrcode?size=300&format=png</code>
                <p className="text-xs text-gray-500 mt-2">Parameters: size (100-1000), format (png/svg), dark, light</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button onClick={onClose} className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
