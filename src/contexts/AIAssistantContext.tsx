import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAiPowered?: boolean;
  visualAids?: VisualAid[];
}

export interface VisualAid {
  type: 'stepCard' | 'statsCard' | 'rankingCard' | 'pollCard';
  content: any;
}

export interface QuickAction {
  label: string;
  prompt: string;
}

export interface WizardState {
  type: string;
  currentStep: number;
  totalSteps: number;
  data: Record<string, any>;
  options?: { label: string; value: string | number }[];
  canSkip?: boolean;
}

export type ChatPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface AIAssistantSettings {
  position: ChatPosition;
  buttonColor: string;
  panelWidth: number;
  voiceEnabled: boolean;
  enabled: boolean;
}

interface AIAssistantContextType {
  // State
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
  wizardState: WizardState | null;
  quickActions: QuickAction[];
  settings: AIAssistantSettings;

  // Actions
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setWizardState: (state: WizardState | null) => void;
  setQuickActions: (actions: QuickAction[]) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  updateSettings: (settings: Partial<AIAssistantSettings>) => void;
}

const defaultSettings: AIAssistantSettings = {
  position: 'bottom-right',
  buttonColor: '#1e40af',
  panelWidth: 380,
  voiceEnabled: true,
  enabled: true,
};

const defaultQuickActions: QuickAction[] = [
  { label: 'Create Poll', prompt: 'Help me create a new poll' },
  { label: 'Active Polls', prompt: 'Show me all active polls' },
  { label: 'View Results', prompt: 'Show poll results and analytics' },
];

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>(defaultQuickActions);
  const [settings, setSettings] = useState<AIAssistantSettings>(defaultSettings);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiAssistantSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse AI assistant settings:', e);
      }
    }

    // Load saved messages
    const savedMessages = localStorage.getItem('aiAssistantMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error('Failed to parse AI assistant messages:', e);
      }
    }

    // Add welcome message if no messages
    if (!savedMessages) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI polling assistant. I can help you create polls, view results, analyze trends, and answer questions about your polling data. What would you like to do?",
        timestamp: new Date(),
        isAiPowered: true,
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiAssistantMessages', JSON.stringify(messages.slice(-50))); // Keep last 50
    }
  }, [messages]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    addMessage({ role: 'user', content });
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          wizardState,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: data.message,
        isAiPowered: data.isAiPowered ?? true,
        visualAids: data.visualAids,
      });

      // Handle wizard state
      if (data.wizardState) {
        setWizardState(data.wizardState);
      } else if (wizardState && !data.continueWizard) {
        setWizardState(null);
      }

      // Handle suggested actions
      if (data.suggestedActions && data.suggestedActions.length > 0) {
        setQuickActions(data.suggestedActions);
      }

    } catch (error: any) {
      console.error('AI Assistant error:', error);
      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, messages, wizardState]);

  const clearMessages = useCallback(() => {
    const welcomeMessage: Message = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Chat cleared! How can I help you with your polls today?",
      timestamp: new Date(),
      isAiPowered: true,
    };
    setMessages([welcomeMessage]);
    setWizardState(null);
    setQuickActions(defaultQuickActions);
    localStorage.removeItem('aiAssistantMessages');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType });

          // Check minimum size
          if (audioBlob.size < 5000) {
            addMessage({
              role: 'assistant',
              content: 'Recording was too short. Please speak for at least a second.',
            });
            return;
          }

          // Transcribe
          setIsLoading(true);
          try {
            const formData = new FormData();
            const extension = recorder.mimeType.includes('webm') ? 'webm' : 'm4a';
            formData.append('audio', audioBlob, `recording.${extension}`);

            const response = await fetch('/api/ai-assistant/transcribe', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();

            if (data.success && data.text) {
              await sendMessage(data.text);
            } else {
              addMessage({
                role: 'assistant',
                content: `Could not transcribe audio: ${data.error || 'Unknown error'}`,
              });
            }
          } catch (error: any) {
            console.error('Transcription error:', error);
            addMessage({
              role: 'assistant',
              content: 'Failed to transcribe audio. Please try again.',
            });
          } finally {
            setIsLoading(false);
          }
        }
      };

      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
          setMediaRecorder(null);
        }
      }, 60000);

    } catch (error: any) {
      console.error('Microphone error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        addMessage({
          role: 'assistant',
          content: 'Microphone access was denied. Please allow microphone access in your browser settings.',
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `Could not access microphone: ${error.message}`,
        });
      }
    }
  }, [addMessage, sendMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, isRecording]);

  const updateSettings = useCallback((newSettings: Partial<AIAssistantSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        messages,
        isLoading,
        isRecording,
        wizardState,
        quickActions,
        settings,
        toggleChat,
        openChat,
        closeChat,
        sendMessage,
        clearMessages,
        setWizardState,
        setQuickActions,
        startRecording,
        stopRecording,
        updateSettings,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
}
