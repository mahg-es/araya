# ChatGPT bundle

Reproducible packaging of the canonical AX3 v0.6.0 core for a custom ChatGPT
(GPT). It consumes the same `GPT-CONFIGURATION.md` + `K01`–`K10` core as the Pi
adapter and never rewrites it.

## Build

```bash
bash bundle/chatgpt/build.sh
```

Output: `bundle/chatgpt/dist/ARAYA-AX3-v0.6.0-chatgpt.zip`.

The build verifies the canonical core first (SHA-256), assembles the knowledge
files, writes a manifest, and validates the produced bundle.

## Install into ChatGPT

1. Create a new GPT in ChatGPT.
2. Set the name to `ARAYA AX3 v0.6.0` (see `gpt-manifest.json`).
3. Set the description from `gpt-manifest.json`.
4. Paste the contents of `instructions.md` (the kernel) into the Instructions
   field.
5. Upload the 10 files from `knowledge/` (K01–K10).
6. Save.

The packaging contract (K10) requires exactly 10 Knowledge files and the kernel
as Instructions — never an 11th Knowledge file.
