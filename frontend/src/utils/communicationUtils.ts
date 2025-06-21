import { CommunicationChannel, ConversationStatus, Language, LanguageCode } from '../types/communication';

// Language definitions with flag emojis
export const LANGUAGES: Record<LanguageCode, Language> = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  it: { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  pt: { code: 'pt', name: 'Português', flag: '🇵🇹' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳' },
  ja: { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ko: { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ar: { code: 'ar', name: 'العربية', flag: '🇸🇦' },
};

// Channel icons and labels
export const CHANNEL_CONFIG = {
  whatsapp: {
    icon: '📱',
    label: 'WhatsApp',
    color: '#25D366',
  },
  sms: {
    icon: '💬',
    label: 'SMS',
    color: '#2196F3',
  },
  email: {
    icon: '📧',
    label: 'Email',
    color: '#FF9800',
  },
  call: {
    icon: '📞',
    label: 'Call',
    color: '#4CAF50',
  },
};

// Status colors and labels
export const STATUS_CONFIG = {
  ai: {
    icon: '🤖',
    label: 'AI',
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  human: {
    icon: '👤',
    label: 'Human',
    color: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  waiting: {
    icon: '⏸️',
    label: 'Waiting',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  resolved: {
    icon: '✅',
    label: 'Resolved',
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
};

// Priority colors
export const PRIORITY_CONFIG = {
  low: { color: '#9E9E9E', backgroundColor: '#F5F5F5' },
  medium: { color: '#2196F3', backgroundColor: '#E3F2FD' },
  high: { color: '#FF9800', backgroundColor: '#FFF3E0' },
  urgent: { color: '#F44336', backgroundColor: '#FFEBEE' },
};

// Utility functions
export const getChannelIcon = (channel: CommunicationChannel): string => {
  return CHANNEL_CONFIG[channel]?.icon || '💬';
};

export const getChannelLabel = (channel: CommunicationChannel): string => {
  return CHANNEL_CONFIG[channel]?.label || channel;
};

export const getChannelColor = (channel: CommunicationChannel): string => {
  return CHANNEL_CONFIG[channel]?.color || '#2196F3';
};

export const getStatusIcon = (status: ConversationStatus): string => {
  return STATUS_CONFIG[status]?.icon || '❓';
};

export const getStatusLabel = (status: ConversationStatus): string => {
  return STATUS_CONFIG[status]?.label || status;
};

export const getStatusColor = (status: ConversationStatus): string => {
  return STATUS_CONFIG[status]?.color || '#2196F3';
};

export const getStatusBackgroundColor = (status: ConversationStatus): string => {
  return STATUS_CONFIG[status]?.backgroundColor || '#F5F5F5';
};

export const getLanguageFlag = (languageCode: LanguageCode): string => {
  return LANGUAGES[languageCode]?.flag || '🌐';
};

export const getLanguageName = (languageCode: LanguageCode): string => {
  return LANGUAGES[languageCode]?.name || languageCode.toUpperCase();
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const formatMessageTime = (timestamp: string): string => {
  const messageTime = new Date(timestamp);
  return messageTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const truncateMessage = (message: string | undefined, maxLength: number = 50): string => {
  if (!message) return 'No message';
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#4CAF50'; // Green
  if (confidence >= 0.6) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

export const shouldShowAlert = (conversation: any): boolean => {
  // Show alert for urgent priority or low AI confidence
  return conversation.priority === 'urgent' || 
         (conversation.aiConfidence && conversation.aiConfidence < 0.5) ||
         conversation.status === 'waiting';
};

export const sortConversationsByPriority = (conversations: any[]): any[] => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  
  return [...conversations].sort((a, b) => {
    // First sort by status (human and waiting first)
    if (a.status === 'human' && b.status !== 'human') return -1;
    if (b.status === 'human' && a.status !== 'human') return 1;
    if (a.status === 'waiting' && b.status !== 'waiting') return -1;
    if (b.status === 'waiting' && a.status !== 'waiting') return 1;
    
    // Then by priority
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Finally by last message time (newest first)
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
  });
};

// Missing functions that components are trying to import
export const formatTime = formatMessageTime; // Alias for existing function

// Material-UI compatible priority color function
export const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent'): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
    default:
      return 'default';
  }
}; 