# ARAYA TerminalApiAdapter MVP (Phase 3.7 Design)

This document designs the `TerminalApiAdapter` MVP, mapping out the runtime flow, message history loop, tool execution sequence, structured output verification, and safe mock-provider integrations.

---

## 1. Runtime Flow & Message Loop

The `TerminalApiAdapter` wraps standard text-completion or chat-completion APIs into a stateful, agentic loop.

```
DelegationEngine.executeSubagent(...)
      │
      ▼
Initialize Message History (System Prompt + Task)
      │
      ▼
Loop: Request LLM Completion (Mock Provider)
      │
      ├─► LLM requests Tool Call?
      │     ├─► Check permissions & requestApproval()
      │     ├─► Execute via ToolRegistry (Sandbox/Worktree path-aware)
      │     ├─► Append output to history & loop back
      │
      └─► LLM returns final text response?
            ├─► Parse JSON StructuredOutput
            ├─► Validation passes? ──► [Success] Merge Worktree & Return
            └─► Validation fails?  ──► Log error, increment retry & loop back
```

---

## 2. Structural & Architectural Integrations

### Message Model
* Maintains a stateful conversation thread (`Array<Message>`) containing:
  * `system`: Persona prompt + skills mapping.
  * `user`: Task descriptions, parsing retry corrections.
  * `assistant`: Model thoughts and tool calls.
  * `tool`: Outputs and stderr streams from the `ToolRegistry`.

### Tool-Call Emulation
* Intercepts `tool_calls` emitted by the LLM.
* Validates arguments against the sandbox directory boundaries.
* Invokes `requestApproval(action, reason)` for sensitive operations (e.g. `write_file`, `run_tests`). If rejected, feeds a refusal status ("Action denied by user security gate.") back as the tool result.
* Dispatches execution to `ToolRegistry.executeTool(name, args)`.

### Structured Output & Retries
* Enforces output schema by checking for a markdown-fenced `\`\`\`json` block.
* Parses the text into ARAYA's `StructuredOutput` payload.
* **Retry Check**: If JSON parsing fails or required fields are missing, increments a retry counter, appends the parser error to the history, and requests another turn (maximum of 3 retries). If retries are exhausted, returns a failed structured output.

### Worktree Sandbox Integration
* If worktree sandbox execution is active, the adapter:
  1. Resolves the active run branch and checkout folder via `WorktreeSandboxManager`.
  2. Directs the `ToolRegistry` to execute all read, write, and directory queries relative to the temporary worktree sandbox folder, avoiding any edits to main repository files.
  3. Stages and commits edits inside the worktree directory upon completion.

### ProviderRegistry & Cost Model
* Looks up provider model names, capabilities, and token pricing rates.
* Multiplies accumulated input/output tokens by the pricing rates to compute total run cost (`cost_estimate_usd`).

---

## 3. Mock-Provider Strategy & Deferred Scope

### Mock Provider
* In MVP mode, the adapter executes against a local `MockCompletionProvider`.
* The mock provider simulates conversational turns by:
  1. Returning a mock tool call (e.g., writing a file or executing tests).
  2. Processing the tool output and returning the final `StructuredOutput` payload.

### Deferred Scope
* External network connections and model API endpoints (OpenAI, Gemini, Claude, etc.).
* Automated Git conflict resolving.
