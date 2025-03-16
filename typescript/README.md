# `@dfinity/llm`

A library for making requests to the LLM canister on the Internet Computer.

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
