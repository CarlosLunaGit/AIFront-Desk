import { IAIProvider, MessageContext, AIResponse } from './IAIProvider';
import { logger } from '../../utils/logger';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class OpenAIProvider implements IAIProvider {
  private config: OpenAIConfig;
  private initialized: boolean = false;

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey || this.config.apiKey === 'your-openai-api-key-here') {
      logger.warn('⚠️  OpenAI API key not configured. AI features will be disabled for testing.');
      return;
    }
    
    try {
      // Test API connection with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      this.initialized = true;
      logger.info('OpenAI provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI provider:', error);
      throw error;
    }
  }

  async processMessage(context: MessageContext): Promise<AIResponse> {
    if (!this.isReady()) {
      // Debug logging to understand why isReady() is false
      logger.warn('OpenAI not ready:', {
        initialized: this.initialized,
        hasApiKey: !!this.config.apiKey,
        apiKeyValue: this.config.apiKey?.substring(0, 10) + '...',
        isPlaceholder: this.config.apiKey === 'your-openai-api-key-here'
      });
      
      // Return a fallback response when AI is not configured
      return {
        content: "Hello! I'm currently in testing mode. Our AI assistant is not fully configured yet, but I'm here to help you with your hotel needs. Please contact our front desk for immediate assistance.",
        confidence: 0.5,
        metadata: {
          model: 'fallback',
          tokens_used: 0,
          response_time: Date.now(),
          fallback: true
        }
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = context.content;

      logger.info('Making OpenAI API call:', {
        model: this.config.model,
        userMessage: userMessage.substring(0, 50) + '...',
        systemPromptLength: systemPrompt.length
      });

      // Add small delay to help with rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenAI API error ${response.status}:`, errorText);
        
        if (response.status === 429) {
          // Rate limit exceeded - return helpful fallback
          return {
            content: "I'm experiencing high demand right now. Let me help you with your hotel inquiry! For immediate assistance with reservations, please call our front desk directly.",
            confidence: 0.6,
            metadata: {
              model: 'fallback-rate-limited',
              tokens_used: 0,
              response_time: Date.now(),
              rateLimited: true
            }
          };
        }
        
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || '';
      const confidence = this.calculateConfidence(data, context);

      return {
        content: aiMessage,
        confidence,
        metadata: {
          model: this.config.model,
          tokens_used: data.usage?.total_tokens || 0,
          response_time: Date.now(),
        },
      };
    } catch (error) {
      logger.error('OpenAI processing error:', error);
      throw error;
    }
  }

  async generateTemplateResponse(templateId: string, context: MessageContext): Promise<AIResponse> {
    const templates = {
      'checkin_early': `The guest is requesting early check-in. Based on hotel policy and room availability, provide a helpful response.`,
      'checkout_late': `The guest is requesting late checkout. Consider hotel policy and room bookings.`,
      'room_service': `The guest is asking about room service. Provide information about availability, menu, and ordering process.`,
      'amenities': `The guest is asking about hotel amenities. Provide comprehensive information about facilities.`,
      'local_attractions': `The guest wants information about local attractions and activities.`,
      'complaint': `The guest has a complaint. Respond professionally and offer solutions.`,
    };

    const template = templates[templateId as keyof typeof templates];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const enhancedContext = {
      ...context,
      content: `${template}\n\nGuest message: ${context.content}`,
    };

    return this.processMessage(enhancedContext);
  }

  isReady(): boolean {
    return this.initialized && !!this.config.apiKey && this.config.apiKey !== 'your-openai-api-key-here';
  }

  getCapabilities() {
    return {
      supportsVoice: false,
      supportsTemplates: true,
      maxMessageLength: 4000,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
    };
  }

  private buildSystemPrompt(context: MessageContext): string {
    const hotelName = context.metadata?.hotelName || 'our hotel';
    const sessionState = context.metadata?.sessionState || 'greeting';
    const isReservationRequest = context.metadata?.isReservationRequest;
    const conversationHistory = context.metadata?.conversationHistory || [];
    const reservationData = context.metadata?.reservationData || {};

    let systemPrompt = `You are an AI hotel receptionist for ${hotelName}. Your role is to:

1. Provide helpful, professional, and courteous responses to guest inquiries
2. Handle hotel reservations, room service, amenities info, and local recommendations
3. Maintain a warm, welcoming tone while being efficient and informative
4. Use natural, conversational language appropriate for ${context.channel} messaging

Current Context:
- Hotel: ${hotelName}
- Channel: ${context.channel}
- Conversation State: ${sessionState}`;

    if (isReservationRequest) {
      systemPrompt += `
- Guest is interested in making a reservation
- Guide them through the booking process naturally`;
    }

    if (conversationHistory.length > 0) {
      systemPrompt += `
- Recent conversation context available
- Continue the conversation naturally based on previous messages`;
    }

    if (Object.keys(reservationData).length > 0) {
      systemPrompt += `
- Reservation in progress with data: ${JSON.stringify(reservationData)}
- Use this information to provide contextual responses`;
    }

    systemPrompt += `

Guidelines:
- Keep responses concise but complete (2-3 sentences max for WhatsApp)
- Always be helpful and offer additional assistance
- If you cannot handle a request, politely direct to front desk
- Use professional hospitality language with a friendly tone
- For reservations, guide guests through dates, guest count, and contact info naturally
- Don't be overly formal - match the guest's tone while remaining professional

Respond as a knowledgeable, friendly hotel receptionist who genuinely wants to help.`;

    return systemPrompt;
  }

  private calculateConfidence(data: any, context: MessageContext): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on response length (very short or very long responses might be less confident)
    const responseLength = data.choices[0]?.message?.content?.length || 0;
    if (responseLength < 20 || responseLength > 1000) {
      confidence -= 0.1;
    }

    // Adjust based on message clarity (simple heuristic)
    const userMessage = context.content.toLowerCase();
    const clarityKeywords = ['please', 'help', 'can you', 'would like', 'need'];
    const hasClarityKeywords = clarityKeywords.some(keyword => userMessage.includes(keyword));
    if (hasClarityKeywords) {
      confidence += 0.1;
    }

    // Adjust based on common hotel topics
    const hotelKeywords = ['room', 'check', 'service', 'hotel', 'booking', 'reservation'];
    const hasHotelKeywords = hotelKeywords.some(keyword => userMessage.includes(keyword));
    if (hasHotelKeywords) {
      confidence += 0.1;
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }
} 