---
name: model-fine-tuning
description: "Fine-tune open-source LLMs — LoRA, QLoRA, dataset preparation, and evaluation —"
---
---

# Model Fine-Tuning

Fine-tune open-source LLMs — LoRA, QLoRA, dataset preparation, and evaluation —
adapting models to specific domains, tasks, or styles while using minimal
compute resources.

## What problem this solves
Base models are generalists; fine-tuned models are specialists. A fine-tuned
model on your data understands your domain, follows your style, and outperforms
much larger general models on your specific tasks — all while running locally.

## When to use
When a base model doesn't perform well on a specific domain or task. When
you need a model that writes in a specific style. When smaller, specialized
models would be more cost-effective than large general models.

## Input
Task description, training examples (10-1000+), base model, available hardware.

## Output
A fine-tuning configuration with dataset, training parameters, evaluation
metrics, and deployment instructions.

## Steps
1. Define the task: classification, generation, instruction-following, style transfer
2. Collect and format dataset: instruction-input-output triples or prompt-completion pairs
3. Choose base model: Mistral 7B, Llama 3 8B, Qwen 2.5 7B — quantized for memory efficiency
4. Select fine-tuning method:
   - LoRA (Low-Rank Adaptation): train small adapter weights, 10-50MB
   - QLoRA: quantized base + LoRA — fits in 16GB GPU or 32GB CPU
   - Full fine-tuning: only for large datasets + abundant compute
5. Configure training: rank (r=8-64), alpha, learning rate, epochs, batch size
6. Train: `unsloth`, `axolotl`, or Hugging Face `trl` with QLoRA
7. Evaluate: held-out test set, compare to base model, check for overfitting
8. Deploy: merge adapter into GGUF quantized model for local inference

## Rules
- LoRA/QLoRA is sufficient for 90% of use cases — full fine-tuning is overkill
- Dataset quality > dataset size: 100 high-quality examples beat 1000 noisy ones
- Start with r=16, alpha=32 — tune only if underfitting or overfitting
- Evaluate on held-out data — training accuracy is meaningless
- Check for catastrophic forgetting: model should still perform on general tasks
- Training on CPU with QLoRA is viable — llama.cpp + QLoRA works on consumer hardware
- Coordinate with María for deployment after fine-tuning
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
