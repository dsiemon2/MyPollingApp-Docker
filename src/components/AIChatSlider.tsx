import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAIAssistant, Message, VisualAid } from '@/contexts/AIAssistantContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AIChatSlider() {
  const {
    isOpen,
    messages,
    isLoading,
    isRecording,
    wizardState,
    quickActions,
    settings,
    toggleChat,
    sendMessage,
    clearMessages,
    startRecording,
    stopRecording,
  } = useAIAssistant();

  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleWizardOption = (value: string | number) => {
    sendMessage(value.toString());
  };

  const handleWizardCancel = () => {
    sendMessage('cancel');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">$1</code>')
      .replace(/### (.*?)$/gm, '<strong class="text-sm">$1</strong>')
      .replace(/## (.*?)$/gm, '<strong class="text-base">$1</strong>')
      .replace(/\n/g, '<br />')
      .replace(/• /g, '&bull; ')
      .replace(/- /g, '&bull; ');
  };

  const renderVisualAid = (aid: VisualAid, index: number) => {
    switch (aid.type) {
      case 'statsCard':
        return (
          <div key={index} className="flex flex-wrap gap-2 mt-2">
            {aid.content.stats?.map((stat: any, i: number) => (
              <div
                key={i}
                className="bg-gradient-to-br from-blue-800 to-blue-500 text-white p-2 rounded-lg text-center flex-1 min-w-[70px]"
              >
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs opacity-90 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        );
      case 'pollCard':
        return (
          <div key={index} className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="font-medium text-sm">{aid.content.title}</div>
            {aid.content.options?.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${opt.percentage || 0}%` }}
                  />
                </div>
                <span className="text-xs">{opt.label} ({opt.votes || 0})</span>
              </div>
            ))}
          </div>
        );
      case 'stepCard':
        return (
          <div key={index} className="mt-2 p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-xs mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Step-by-Step Guide
            </div>
            {aid.content.steps?.map((step: any, i: number) => (
              <div key={i} className="py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {step.number}
                  </span>
                  <span className="font-medium text-sm">{step.title}</span>
                </div>
                {step.content && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-7">{step.content}</div>
                )}
              </div>
            ))}
          </div>
        );
      case 'rankingCard':
        return (
          <div key={index} className="mt-2 p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 font-semibold text-xs mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Current Rankings
            </div>
            {aid.content.rankings?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                <span className="flex-1 font-medium text-sm">{item.name}</span>
                <span className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">{item.points} pts</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5',
  };

  const panelPositionClasses = {
    'bottom-right': 'bottom-16 right-0',
    'bottom-left': 'bottom-16 left-0',
    'top-right': 'top-16 right-0',
    'top-left': 'top-16 left-0',
  };

  if (!settings.enabled) return null;

  return (
    <div
      className={`fixed z-[9999] ${positionClasses[settings.position]}`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full border-none text-white text-2xl cursor-pointer shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110 hover:shadow-xl"
        style={{ backgroundColor: settings.buttonColor }}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 9a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`absolute ${panelPositionClasses[settings.position]} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp`}
          style={{ width: `${settings.panelWidth}px`, maxHeight: '550px' }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex justify-between items-center rounded-t-2xl"
            style={{ backgroundColor: settings.buttonColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 9a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z" />
                </svg>
              </div>
              <div>
                <strong className="block">AI Assistant</strong>
                <span className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearMessages}
                className="bg-white/20 border-none text-white w-8 h-8 rounded-full cursor-pointer flex items-center justify-center hover:bg-white/30"
                title="Clear chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={toggleChat}
                className="bg-white/20 border-none text-white w-8 h-8 rounded-full cursor-pointer flex items-center justify-center hover:bg-white/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 max-h-[300px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 mb-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                    message.role === 'user' ? 'bg-gray-500' : 'bg-blue-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 9a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z" />
                    </svg>
                  )}
                </div>
                <div
                  className={`max-w-[85%] p-3 rounded-xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-gray-800 rounded-tl-sm'
                  }`}
                >
                  <p
                    className="m-0 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                  />
                  {message.visualAids?.map((aid, i) => renderVisualAid(aid, i))}
                  <span
                    className={`text-xs mt-1 block ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                    {message.isAiPowered && message.role === 'assistant' && (
                      <span className="ml-2 inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        AI
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 9a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z" />
                  </svg>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions or Wizard Options */}
          {wizardState ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-200 dark:border-blue-800">
              {wizardState.totalSteps > 1 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Step {wizardState.currentStep + 1} of {wizardState.totalSteps}</span>
                  <div className="flex-1 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${((wizardState.currentStep + 1) / wizardState.totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {wizardState.options?.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleWizardOption(option.value)}
                    className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-900 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
                {wizardState.canSkip && (
                  <button
                    onClick={() => sendMessage('skip')}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors ml-auto"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleWizardCancel}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full text-xs cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Voice Recording Indicator */}
          {isRecording && (
            <div className="p-4 bg-gradient-to-r from-blue-800 to-blue-500 text-white flex flex-col items-center gap-2 border-t border-blue-700">
              <div className="flex gap-1 items-center h-8">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-white rounded animate-pulse"
                    style={{
                      height: `${10 + Math.random() * 15}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">Recording...</span>
              <button
                onClick={stopRecording}
                className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-full text-sm cursor-pointer flex items-center gap-2 hover:bg-white/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop Recording
              </button>
            </div>
          )}

          {/* Input Area */}
          {!isRecording && (
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 items-center">
              {settings.voiceEnabled && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white border-red-500 animate-pulse'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-red-500'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-full border-none text-white cursor-pointer flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: settings.buttonColor }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease;
        }
      `}</style>
    </div>
  );
}
