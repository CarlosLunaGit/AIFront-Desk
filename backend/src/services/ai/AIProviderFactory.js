"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = void 0;
const TwilioAIProvider_1 = require("./TwilioAIProvider");
const logger_1 = require("../../utils/logger");
class AIProviderFactory {
    constructor() {
        this.providers = new Map();
        this.currentProvider = null;
    }
    static getInstance() {
        if (!AIProviderFactory.instance) {
            AIProviderFactory.instance = new AIProviderFactory();
        }
        return AIProviderFactory.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Initialize Twilio provider
                const twilioProvider = new TwilioAIProvider_1.TwilioAIProvider();
                yield twilioProvider.initialize();
                this.providers.set('twilio', twilioProvider);
                // Set the current provider based on environment variable
                const providerName = ((_a = process.env.AI_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'twilio';
                this.setCurrentProvider(providerName);
                logger_1.logger.info(`AI Provider Factory initialized with provider: ${providerName}`);
            }
            catch (error) {
                logger_1.logger.error('Failed to initialize AI Provider Factory:', error);
                throw error;
            }
        });
    }
    setCurrentProvider(providerName) {
        const provider = this.providers.get(providerName.toLowerCase());
        if (!provider) {
            throw new Error(`AI Provider '${providerName}' not found`);
        }
        this.currentProvider = provider;
        logger_1.logger.info(`Current AI Provider set to: ${providerName}`);
    }
    getCurrentProvider() {
        if (!this.currentProvider) {
            throw new Error('No AI Provider has been set');
        }
        return this.currentProvider;
    }
    getProvider(providerName) {
        const provider = this.providers.get(providerName.toLowerCase());
        if (!provider) {
            throw new Error(`AI Provider '${providerName}' not found`);
        }
        return provider;
    }
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }
}
exports.AIProviderFactory = AIProviderFactory;
