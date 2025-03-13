# Using @dfinity/llm with Azle

This guide explains how to integrate the `@dfinity/llm` package with your Azle project.

## Installation

First, install the package in your Azle project:

```bash
npm install @dfinity/llm
```

## Basic Integration

Here's how to use the package in your Azle canister:

```typescript
import { update } from 'azle';
import { prompt, chat, Role, createChatMessage, Model } from '@dfinity/llm';

export default class {
    // Simple prompt endpoint
    @update
    async askLlm(question: string): Promise<string> {
        return await prompt(Model.Llama3_1_8B, question);
    }

    // Chat endpoint
    @update
    async chatWithLlm(messages: { role: string, content: string }[]): Promise<string> {
        // Convert the incoming messages to the proper format
        const formattedMessages = messages.map(msg => {
            let role: Role;
            switch(msg.role) {
                case 'system':
                    role = Role.System;
                    break;
                case 'assistant':
                    role = Role.Assistant;
                    break;
                case 'user':
                default:
                    role = Role.User;
                    break;
            }
            return createChatMessage(role, msg.content);
        });

        return await chat(Model.Llama3_1_8B, formattedMessages);
    }
}
```

## Complete Example

Here's a complete example of an Azle canister that uses the `@dfinity/llm` package:

```typescript
import { IDL, update, query } from 'azle';
import { prompt, chat, Role, createChatMessage, Model, ChatMessage } from '@dfinity/llm';

// Define the message format for the API
const MessageFormat = IDL.Record({
    role: IDL.Text,
    content: IDL.Text
});

export default class {
    // Store conversation history
    private conversations: Map<string, ChatMessage[]> = new Map();

    @update([IDL.Text, IDL.Text], IDL.Text)
    async startConversation(userId: string, systemPrompt: string): Promise<string> {
        // Initialize a new conversation with a system prompt
        const initialMessages = [
            createChatMessage(Role.System, systemPrompt)
        ];
        
        this.conversations.set(userId, initialMessages);
        return "Conversation started";
    }

    @update([IDL.Text, IDL.Text], IDL.Text)
    async sendMessage(userId: string, message: string): Promise<string> {
        // Get the conversation or initialize a new one
        let conversation = this.conversations.get(userId);
        if (!conversation) {
            conversation = [
                createChatMessage(Role.System, "You are a helpful assistant.")
            ];
            this.conversations.set(userId, conversation);
        }
        
        // Add the user message
        conversation.push(createChatMessage(Role.User, message));
        
        // Get the response
        const response = await chat(Model.Llama3_1_8B, conversation);
        
        // Add the assistant response to the conversation
        conversation.push(createChatMessage(Role.Assistant, response));
        
        return response;
    }

    @query([IDL.Text], IDL.Vec(MessageFormat))
    getConversation(userId: string): { role: string, content: string }[] {
        const conversation = this.conversations.get(userId);
        if (!conversation) {
            return [];
        }
        
        // Convert to the API format
        return conversation.map(msg => ({
            role: msg.role.toString(),
            content: msg.content
        }));
    }
}
```

## Notes

- The LLM canister is called using inter-canister calls, so your canister will need to have the appropriate cycles to pay for these calls.
- The response time can vary depending on the model and the length of the input.
- Consider implementing rate limiting and error handling in production applications. 
