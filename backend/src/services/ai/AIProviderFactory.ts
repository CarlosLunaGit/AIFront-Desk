import { IAIProvider } from './IAIProvider';
import { TwilioAIProvider } from './TwilioAIProvider';
import { logger } from '../../utils/logger';

export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private providers: Map<string, IAIProvider> = new Map();
  private currentProvider: IAIProvider | null = null;

  private constructor() {}

  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Twilio provider
      const twilioProvider = new TwilioAIProvider();
      await twilioProvider.initialize();
      this.providers.set('twilio', twilioProvider);

      // Set the current provider based on environment variable
      const providerName = process.env.AI_PROVIDER?.toLowerCase() || 'twilio';
      this.setCurrentProvider(providerName);

      logger.info(`AI Provider Factory initialized with provider: ${providerName}`);
    } catch (error) {
      logger.error('Failed to initialize AI Provider Factory:', error);
      throw error;
    }
  }

  setCurrentProvider(providerName: string): void {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`AI Provider '${providerName}' not found`);
    }
    this.currentProvider = provider;
    logger.info(`Current AI Provider set to: ${providerName}`);
  }

  getCurrentProvider(): IAIProvider {
    if (!this.currentProvider) {
      throw new Error('No AI Provider has been set');
    }
    return this.currentProvider;
  }

  getProvider(providerName: string): IAIProvider {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`AI Provider '${providerName}' not found`);
    }
    return provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
} 