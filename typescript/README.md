# `@dfinity/llm`

A library for making requests to the LLM canister on the Internet Computer.

## Local Development Setup

Before using this library in local development, you need to set up the LLM canister dependency:

### Prerequisites
- [DFX](https://internetcomputer.org/docs/building-apps/getting-started/install) installed
- [Ollama](https://ollama.com/) installed and running locally

### Setup Steps

1. **Start Ollama** (required for local development):
```bash
# Start the Ollama server
ollama serve

# Download the required model (one-time setup)
ollama run llama3.1:8b
```

2. **Add LLM canister to your dfx.json**:
```json
{
  "canisters": {
    "llm": {
      "type": "pull",
      "id": "w36hm-eqaaa-aaaal-qr76a-cai"
    },
    "your-canister": {
      "dependencies": ["llm"],
      "type": "azle"
    }
  }
}
```

3. **Deploy locally**:
```bash
dfx start --clean
dfx deps pull
dfx deps deploy
dfx deploy
```

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

### Advanced Usage with Tools

#### Understanding Tools

**Tools** are custom functions that you define and make available to the LLM. They allow the AI to perform actions beyond just generating text responses. When you provide tools to the LLM, it can decide when and how to use them based on the user's request.

**Common use cases for tools:**
- **Data retrieval**: Fetching real-time information (prices, weather, account balances)
- **External API calls**: Integrating with third-party services
- **Calculations**: Performing complex computations
- **Database operations**: Querying or updating data
- **Custom business logic**: Executing domain-specific functions

**How it works:**
1. You define available tools with their parameters
2. The LLM analyzes the user's request
3. If a tool would be helpful, the LLM returns a "tool call" instead of a direct answer
4. Your code executes the requested tool with the LLM's provided parameters
5. You send the tool's result back to the LLM
6. The LLM incorporates the result into its final response

#### Defining and Using Tools

You can define tools that the LLM can use to perform actions:

```typescript
import { IDL, update } from "azle";
import { 
  chat_message as ChatMessageIDL, 
  chat_request as ChatRequestIDL,
  chat_response as ChatResponseIDL 
} from "azle/canisters/llm/idl";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Text], ChatResponseIDL)
  async chatWithTools(userMessage: string): Promise<llm.ChatResponse> {
    const tools: llm.Tool[] = [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The location to get weather for"
              }
            },
            required: ["location"]
          }
        }
      }
    ];

    const request: llm.ChatRequest = {
      model: llm.Model.Llama3_1_8B,
      messages: [
        {
          role: { system: null },
          content: "You are a helpful assistant"
        },
        {
          role: { user: null },
          content: userMessage
        }
      ],
      tools: [tools]
    };

    return await llm.chatWithTools(request);
  }
}
```

#### Handling Tool Calls from the LLM

When the LLM decides to use one of your tools, you need to handle the tool call and provide the result:

```typescript
import { IDL, update } from "azle";
import { 
  chat_message as ChatMessageIDL, 
  chat_request as ChatRequestIDL,
  chat_response as ChatResponseIDL 
} from "azle/canisters/llm/idl";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Text], IDL.Text)
  async handleChatWithTools(userMessage: string): Promise<string> {
    const tools: llm.Tool[] = [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The location to get weather for"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_icp_price",
          description: "Get the current ICP token price",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ];

    let messages: llm.ChatMessage[] = [
      {
        role: { system: null },
        content: "You are a helpful assistant"
      },
      {
        role: { user: null },
        content: userMessage
      }
    ];

    const initialRequest: llm.ChatRequest = {
      model: llm.Model.Llama3_1_8B,
      messages: messages,
      tools: [tools]
    };

    const response = await llm.chatWithTools(initialRequest);

    // Check if LLM wants to use tools
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      // Add assistant message with tool calls
      messages.push({
        role: { assistant: null },
        content: response.message.content,
        tool_calls: response.message.tool_calls
      });

      // Process each tool call
      for (const toolCall of response.message.tool_calls) {
        let toolResult: string;
        
        switch (toolCall.function.name) {
          case "get_weather":
            const location = this.getToolParameter(toolCall.function.arguments, "location");
            toolResult = await this.getWeather(location);
            break;
          case "get_icp_price":
            toolResult = await this.getIcpPrice();
            break;
          default:
            toolResult = `Unknown tool: ${toolCall.function.name}`;
        }

        // Add tool result to conversation
        messages.push({
          role: { tool: null },
          content: toolResult,
          tool_call_id: [toolCall.id]
        });
      }

      // Get final response from LLM with tool results
      const finalRequest: llm.ChatRequest = {
        model: llm.Model.Llama3_1_8B,
        messages: messages,
        tools: []
      };

      const finalResponse = await llm.chatWithTools(finalRequest);
      return finalResponse.message.content || "No response received";
    } else {
      // No tool calls needed, return direct response
      return response.message.content || "No response received";
    }
  }

  // Helper function to extract parameter values
  private getToolParameter(arguments: llm.ToolCallArgument[], paramName: string): string {
    const arg = arguments.find(arg => arg.name === paramName);
    return arg ? arg.value : "";
  }

  // Example tool implementations
  private async getWeather(location: string): Promise<string> {
    // In a real implementation, you would call a weather API
    return `Weather in ${location}: Sunny, 72°F`;
  }

  private async getIcpPrice(): Promise<string> {
    // In a real implementation, you would call a price API
    return "Current ICP price: $10.50";
  }
}
```
