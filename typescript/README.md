# `@dfinity/llm`

A library for making requests to the LLM canister on the Internet Computer.

## Supported Models

The following LLM models are available:

- `Model.Llama3_1_8B` - Llama 3.1 8B model
- `Model.Qwen3_32B` - Qwen 3 32B model
- `Model.Llama4Scout` - Llama 4 Scout model

## Install

```bash
npm install @dfinity/llm
```

## Usage

### Prompting (single message)

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Text], IDL.Text)
  async prompt(prompt: string): Promise<string> {
    return await llm.prompt(llm.Model.Llama3_1_8B, prompt);
  }
}
```

### Chatting (multiple messages)

```typescript
import { IDL, update } from "azle";
import { chat_message as ChatMessageIDL } from "azle/canisters/llm/idl";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Vec(ChatMessageIDL)], IDL.Text)
  async chat(messages: llm.ChatMessage[]): Promise<string> {
    return await llm.chat(llm.Model.Llama3_1_8B, messages);
  }
}
```
