export type CommunicationChannel = 'whatsapp' | 'sms' | 'email' | 'call';

export type ConversationStatus = 'ai' | 'human' | 'waiting' | 'resolved';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar';

export interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
  confidence?: number;
}

export interface Message {
  id: string;
  content: string;
  type: 'inbound' | 'outbound';
  sender: 'ai' | 'guest' | 'staff';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  confidence?: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface CallData {
  duration?: number;
  recordingUrl?: string;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  transcriptSegments: {
    speaker: 'ai' | 'guest' | 'staff';
    text: string;
    timestamp: string;
    confidence: number;
  }[];
}

export interface Conversation {
  id: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  channel: CommunicationChannel;
  status: ConversationStatus;
  language: Language;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  hotelId: string;
  hotelName: string;
  callData?: CallData;
  aiConfidence?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
}

export interface ChannelStats {
  channel: CommunicationChannel;
  active: number;
  waiting: number;
  resolved: number;
  total: number;
}

export interface CommunicationStats {
  channels: ChannelStats[];
  totalActive: number;
  totalWaiting: number;
  alertsCount: number;
  avgResponseTime: number;
}

export interface TakeoverRequest {
  conversationId: string;
  reason?: string;
  staffId: string;
  countdown?: number;
}

export interface ConversationFilter {
  channel?: CommunicationChannel;
  status?: ConversationStatus;
  language?: LanguageCode;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  searchTerm?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  channel: CommunicationChannel;
  type?: 'text' | 'media' | 'template';
  metadata?: {
    [key: string]: any;
  };
} 