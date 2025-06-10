import { MessageType, MessageChannel } from '../../models/Communication';

export interface MessageContext {
  hotelId: string;
  guestId?: string;
  messageType: MessageType;
  channel: MessageChannel;
  content: string;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface IAIProvider {
  // Initialize the AI provider
  initialize(): Promise<void>;
  
  // Process an incoming message and generate a response
  processMessage(context: MessageContext): Promise<AIResponse>;
  
  // Generate a response for a specific template
  generateTemplateResponse(templateId: string, context: MessageContext): Promise<AIResponse>;
  
  // Check if the provider is ready to handle messages
  isReady(): boolean;
  
  // Get provider-specific capabilities
  getCapabilities(): {
    supportsVoice: boolean;
    supportsTemplates: boolean;
    maxMessageLength: number;
    supportedLanguages: string[];
  };
} 