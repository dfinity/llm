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
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Vec(llm.ChatMessage)], IDL.Text)
  async chat(messages: llm.ChatMessage[]): Promise<string> {
    const response = await llm.chat(llm.Model.Llama3_1_8B)
      .withMessages(messages)
      .send();
    
    return response.message.content || "";
  }
}
```

### Tool Calls

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Text], llm.Response)
  async chatWithTools(userMessage: string): Promise<llm.Response> {
    const messages: llm.ChatMessage[] = [
      {
        role: "user",
        content: userMessage
      }
    ];

    // Define a tool that allows the LLM to get weather information for a location
    const tools: llm.Tool[] = [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA"
              }
            },
            required: ["location"]
          }
        }
      }
    ];

    return await llm.chat(llm.Model.Llama3_1_8B)
      .withMessages(messages)
      .withTools(tools)
      .send();
  }
}
```
