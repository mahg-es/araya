import type { HostCapabilities } from "../adapter";

const DEFAULT_PI_PROVIDER = {
  api_base: "https://api.pi.dev/v1",
  api_key_env: "PI_API_KEY",
  models: {
    fast: "non_thinking_fast",
    balanced: "non_thinking_balanced",
    reasoning: "thinking_reasoning"
  },
  cost_rates: {
    non_thinking_fast: { input_rate_1m: 0.0, output_rate_1m: 0.0 },
    non_thinking_balanced: { input_rate_1m: 0.0, output_rate_1m: 0.0 },
    thinking_reasoning: { input_rate_1m: 0.0, output_rate_1m: 0.0 }
  },
  capabilities: {
    hasBash: true,
    hasFilesystem: true,
    hasNetwork: true,
    nativeToolUse: true
  }
};

export class ProviderRegistry {
  private config: any;

  constructor(config: any) {
    this.config = config || {};
  }

  private getProviderKey(name: string): string {
    const lower = name.toLowerCase();
    return lower === "pi.dev" ? "pi" : lower;
  }

  resolveProvider(name: string): any {
    const key = this.getProviderKey(name);
    const providers = this.config.providers || {};
    
    if (key === "pi" && !providers.pi) {
      return DEFAULT_PI_PROVIDER;
    }

    const provider = providers[key];
    if (!provider) {
      throw new Error(`Unsupported provider: "${name}"`);
    }

    return provider;
  }

  resolveModel(providerName: string, tier: string): string {
    const provider = this.resolveProvider(providerName);
    const models = provider.models || {};
    
    if (tier !== "fast" && tier !== "balanced" && tier !== "reasoning") {
      throw new Error(`Security violation: Unknown model tier "${tier}".`);
    }

    const model = models[tier];
    if (!model) {
      throw new Error(`Model tier "${tier}" is not mapped for provider "${providerName}".`);
    }

    return model;
  }

  resolveApiKey(providerName: string): string | undefined {
    const provider = this.resolveProvider(providerName);
    const envVar = provider.api_key_env;
    if (!envVar) return undefined;
    return process.env[envVar];
  }

  validateApiKey(providerName: string): string {
    const provider = this.resolveProvider(providerName);
    const envVar = provider.api_key_env;
    if (!envVar) {
      throw new Error(`API key environment variable is not defined for provider "${providerName}".`);
    }
    const val = process.env[envVar];
    if (!val || val.trim() === "") {
      throw new Error(`Configuration error - API Key variable "${envVar}" for provider "${providerName}" is not defined.`);
    }
    return val;
  }

  resolveCostRates(providerName: string, model: string): { input_rate_1m: number; output_rate_1m: number } {
    const provider = this.resolveProvider(providerName);
    const rates = provider.cost_rates || {};
    const modelRates = rates[model];
    
    if (!modelRates) {
      return { input_rate_1m: 0.0, output_rate_1m: 0.0 };
    }

    return {
      input_rate_1m: modelRates.input_rate_1m ?? 0.0,
      output_rate_1m: modelRates.output_rate_1m ?? 0.0
    };
  }

  resolveCapabilities(providerName: string): HostCapabilities {
    const provider = this.resolveProvider(providerName);
    const caps = provider.capabilities || {};
    return {
      hasBash: !!caps.hasBash,
      hasFilesystem: !!caps.hasFilesystem,
      hasNetwork: !!caps.hasNetwork,
      nativeToolUse: !!caps.nativeToolUse
    };
  }
}
