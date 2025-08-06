import { Provider } from '@/frontend/stores/APIKeyStore';

export const AI_MODELS = [
  'Deepseek R1 0528',
  'Deepseek V3',
  'Gemini 2.5 Pro',
  'Gemini 2.5 Flash',
  'GPT-4o',
  'GPT-4.1-mini',
  'GLM 4.5',
  'GLM 4.5 air (free)',
  'GPT 4.1',
  'Grok-4',
  'Claude Sonnet 4',
  'Claude Opus 4.1',
] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
};

export const MODEL_CONFIGS = {
  'Deepseek R1 0528': {
    modelId: 'deepseek/deepseek-r1-0528:free',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'Deepseek V3': {
    modelId: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'Gemini 2.5 Pro': {
    modelId: 'gemini-2.5-pro',
    provider: 'google',
    headerKey: 'X-Google-API-Key',
  },
  'Gemini 2.5 Flash': {
    modelId: 'gemini-2.5-flash',
    provider: 'google',
    headerKey: 'X-Google-API-Key',
  },
  'GPT-4o': {
    modelId: 'gpt-4o',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
  },
  'GPT-4.1-mini': {
    modelId: 'gpt-4.1-mini',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
  },
  'GLM 4.5': {
    modelId: 'z-ai/glm-4.5',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'GLM 4.5 air (free)': {
    modelId: 'z-ai/glm-4.5-air:free',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'GPT 4.1': {
    modelId: 'openai/gpt-4.1',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'Grok-4': {
    modelId: 'x-ai/grok-4',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'Claude Sonnet 4': {
    modelId: 'anthropic/claude-sonnet-4',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
  'Claude Opus 4.1': {
    modelId: 'anthropic/claude-opus-4.1',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  return MODEL_CONFIGS[modelName];
};
