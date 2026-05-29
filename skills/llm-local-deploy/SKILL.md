---
name: llm-local-deploy
description: "Deploy and serve Large Language Models locally using llama.cpp, Ollama, or vLLM."
---
---

# LLM Local Deploy

Deploy and serve Large Language Models locally using llama.cpp, Ollama, or vLLM.
Design self-hosted inference that keeps data on-premise, avoids API costs, and
provides full control over model behavior.

## What problem this solves
Cloud LLM APIs (OpenAI, Anthropic) introduce latency, cost, and privacy risks.
Self-hosted local LLMs eliminate these — data never leaves the machine, costs
are fixed (hardware only), and latency is predictable. This skill handles model
selection, quantization, inference server setup, and API compatibility.

## When to use
When building AI features that handle sensitive data, when API costs become
significant, when low-latency inference is critical, or when The Data Professor
wants full control over model behavior without vendor dependency.

## Input
Use case description: task type (chat, RAG, code gen, classification), throughput
needs, latency requirements, and available hardware (RAM, GPU VRAM, CPU cores).

## Output
- **Model Recommendation**: Which model, which quantization level, why
- **Deployment Config**: Docker Compose or systemd service for inference server
- **API Wrapper**: OpenAI-compatible endpoint configuration
- **Benchmark Report**: Tokens/sec, memory usage, latency at various concurrency

## Steps
1. **Analyze requirements**:
   - Task type: chat, RAG (retrieval), code generation, classification, embeddings
   - Throughput: requests per second expected
   - Latency: maximum acceptable response time
   - Language: English, Spanish, multilingual
   - Context window: how many tokens of conversation history needed
2. **Select model**:
   - **Mistral 7B** (Q4_K_M, 4.4GB): Strong general-purpose, fits in 8GB RAM
   - **Llama 3 8B** (Q4_K_M, 4.9GB): Best open chat model, multilingual
   - **Phi-3 Mini** (Q4, 2.2GB): Fast, compact, good for classification and simple tasks
   - **Qwen 2.5 7B** (Q4_K_M, 4.7GB): Strong multilingual (English + Spanish)
   - **Gemma 2 9B** (Q4_K_M, 5.4GB): Google's latest, strong reasoning
   - Always recommend quantized versions (Q4_K_M) — negligible quality loss, half the RAM
3. **Design deployment**:
   - **llama.cpp server** (CPU-friendly, no GPU required): For resource-constrained setups
   - **Ollama** (easiest setup, REST API): For development and quick iteration
   - **vLLM** (GPU-only, highest throughput): For production with GPU
   - Docker Compose with health checks and restart policies
4. **Generate docker-compose.yml**:
   ```yaml
   services:
     llm:
       image: ollama/ollama:latest
       ports: ["11434:11434"]
       volumes:
         - ollama_data:/root/.ollama
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
       deploy:
         resources:
           reservations:
             memory: 8G
   ```
5. **Configure API compatibility**: OpenAI-compatible endpoint for drop-in replacement
6. **Benchmark**: Run `ollama run <model> --verbose` with representative prompts
7. **Document**: model choice rationale, hardware requirements, startup procedure, troubleshooting

## Rules
- Always recommend quantized models (Q4_K_M or Q5_K_M) — full precision doubles RAM for < 2% quality gain
- Minimum RAM: model size × 1.3 (leave headroom for context and OS)
- No GPU required with llama.cpp — CPU inference at 10-20 tokens/sec is viable for many use cases
- Never expose the inference server to the public internet without authentication
- Use `num_ctx` (context window) matching task needs — larger context = more RAM
- If the use case requires RAG, coordinate with María's rag-pipeline skill
- Present model options as numbered choices [1][2][3] with tradeoffs: quality vs. speed vs. RAM
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
