# @dfinity/llm

A TypeScript library for interacting with DFINITY's LLM canister on the Internet Computer.

## Installation

```bash
npm install @dfinity/llm
```

## Usage

### Basic Usage

```typescript
import { prompt, chat, Role, createChatMessage, Model } from '@dfinity/llm';

// Simple prompt
async function askQuestion() {
  const response = await prompt(Model.Llama3_1_8B, "What is the Internet Computer?");
  console.log(response);
}

// Chat conversation
async function chatConversation() {
  const messages = [
    createChatMessage(Role.System, "You are a helpful assistant."),
    createChatMessage(Role.User, "Tell me about DFINITY."),
  ];
  
  const response = await chat(Model.Llama3_1_8B, messages);
  console.log(response);
}
```

### Using the namespace

You can also use the `ic_llm` namespace directly:

```typescript
import { ic_llm } from '@dfinity/llm';

async function example() {
  const message = ic_llm.createChatMessage(ic_llm.Role.User, "Hello!");
  const response = await ic_llm.chat(ic_llm.Model.Llama3_1_8B, [message]);
  console.log(response);
}
```

## API Reference

### Functions

- `prompt(model: Model, promptStr: string): Promise<string>` - Send a single message to the LLM
- `chat(model: Model, messages: ChatMessage[]): Promise<string>` - Send a list of messages to the LLM
- `createChatMessage(role: Role, content: string): ChatMessage` - Create a chat message

### Enums

- `Role` - Message role (System, User, Assistant)
- `Model` - Available LLM models (currently only Llama3_1_8B)

### Interfaces

- `ChatMessage` - Interface for chat messages
- `ChatRequest` - Interface for chat requests

## License

Apache-2.0 
