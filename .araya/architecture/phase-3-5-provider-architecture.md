# ARAYA Provider Architecture (Phase 3.5 Design)

This document maps out ARAYA's configuration-driven Provider Registry (`ProviderRegistry`). It establishes a generic model to resolve AI providers, endpoints, model tiers, and token rates without hardcoded values.

---

## 1. Provider Mappings & araya.yaml Schema

All mappings reside inside `araya.yaml` under a new root-level `providers` block.

### Block Schema Example
```yaml
providers:
  pi:
    api_base: "https://api.pi.dev/v1"
    api_key_env: "PI_API_KEY"
    models:
      fast: "non_thinking_fast"
      balanced: "non_thinking_balanced"
      reasoning: "thinking_reasoning"
    cost_rates:
      non_thinking_fast:
        input_rate_1m: 0.0
        output_rate_1m: 0.0
      non_thinking_balanced:
        input_rate_1m: 0.0
        output_rate_1m: 0.0
      thinking_reasoning:
        input_rate_1m: 0.0
        output_rate_1m: 0.0
    capabilities:
      hasBash: true
      hasFilesystem: true
      hasNetwork: true
      nativeToolUse: true

  openai:
    api_base: "https://api.openai.com/v1"
    api_key_env: "OPENAI_API_KEY"
    models:
      fast: "gpt-4o-mini"
      balanced: "gpt-4o"
      reasoning: "o1-preview"
    cost_rates:
      gpt-4o-mini:
        input_rate_1m: 0.15
        output_rate_1m: 0.60
      gpt-4o:
        input_rate_1m: 5.00
        output_rate_1m: 15.00
      o1-preview:
        input_rate_1m: 15.00
        output_rate_1m: 60.00
    capabilities:
      hasBash: false
      hasFilesystem: false
      hasNetwork: false
      nativeToolUse: true
```

---

## 2. Dynamic Model Tier Mapping

When ARAYA executes a task for an agent (e.g. Sonia):
1. Reads `agents.sonia.primary_provider` (resolves `pi.dev` to `pi`) and `agents.sonia.model_tier` (`reasoning`).
2. Looks up the provider: `providers.pi`.
3. Resolves the active model: `providers.pi.models.reasoning` -> `"thinking_reasoning"`.
4. Retrieves capabilities: `providers.pi.capabilities`.
5. Resolves cost rate records for `"thinking_reasoning"`.

---

## 3. Secret Management & Failure Model

### API Key Resolution
* The config block defines `api_key_env` (e.g. `OPENAI_API_KEY`).
* The registry checks `process.env[api_key_env]`.
* **Security Rule**: The actual key string is **never printed, logged, or serialized**.

### Failure Handling
* If `process.env[api_key_env]` is missing or empty, throws:
  `Error: Configuration error - API Key variable "OPENAI_API_KEY" for provider "openai" is not defined.`
* If an unknown provider name is requested, throws:
  `Error: Unknown provider: "xyz".`
* If a model tier lookup fails, throws:
  `Error: Model tier "reasoning" is not mapped for provider "pi".`

---

## 4. Cost Model & Capability Mappings

* **Cost Rates Lookup**: The pricing table under `cost_rates` defines rates per 1M tokens:
  * `input_rate_1m`: cost per 1,000,000 input tokens (USD)
  * `output_rate_1m`: cost per 1,000,000 output tokens (USD)
* **Capabilities Mapping**: Exposes a standard capability descriptor containing boolean flags: `hasBash`, `hasFilesystem`, `hasNetwork`, `nativeToolUse`.

---

## 5. Backward Compatibility & Versioning

* **Preserving pi.dev**: If `providers` is absent in `araya.yaml` or a provider is not specified, ARAYA falls back to a default hardcoded `pi` config, mapping `pi.dev` with standard default capabilities.
* **Versioning**: Additions are non-intrusive and do not require changing the canonical ARAYA version `0.11.0`.

<!-- Hygiene verified: 2026-05-31 23:22 UTC -->

