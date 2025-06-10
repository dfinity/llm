# `@dfinity/llm`

A TypeScript library for making requests to the LLM canister on the Internet Computer.

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

### Basic Usage

#### Prompting (Single Message)

The simplest way to interact with a model is by sending a single prompt:

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Text], IDL.Text)
  async example(): Promise<string> {
    return await llm.prompt(llm.Model.Llama3_1_8B, "What's the speed of light?");
  }
}
```

#### Chatting (Multiple Messages)

For more complex interactions, you can send multiple messages in a conversation:

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([], IDL.Text)
  async example(): Promise<string> {
    const response = await llm.chat(llm.Model.Llama3_1_8B)
      .withMessages([
        llm.createSystemMessage("You are a helpful assistant"),
        llm.createUserMessage("How big is the sun?")
      ])
      .send();
    
    return response.message.content || "";
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

#### Defining and Using a Tool

You can define tools that the LLM can use to perform actions:

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([], llm.Response)
  async example(): Promise<llm.Response> {
    return await llm.chat(llm.Model.Llama3_1_8B)
      .withMessages([
        llm.createSystemMessage("You are a helpful assistant"),
        llm.createUserMessage("What's the balance of account abc123?")
      ])
      .withTools([
        llm.tool("icp_account_balance")
          .withDescription("Lookup the balance of an ICP account")
          .withParameter(
            llm.parameter("account", llm.ParameterType.String)
              .withDescription("The ICP account to look up")
              .isRequired()
          )
          .build()
      ])
      .send();
  }
}
```

#### Handling Tool Calls from the LLM

When the LLM decides to use one of your tools, you can handle the call:

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([], llm.Response)
  async example(): Promise<llm.Response> {
    const response = await llm.chat(llm.Model.Llama3_1_8B)
      .withMessages([
        llm.createSystemMessage("You are a helpful assistant"),
        llm.createUserMessage("What's the weather in San Francisco?")
      ])
      .withTools([
        llm.tool("get_weather")
          .withDescription("Get current weather for a location")
          .withParameter(
            llm.parameter("location", llm.ParameterType.String)
              .withDescription("The location to get weather for")
              .isRequired()
          )
          .build()
      ])
      .send();

    // Process tool calls if any
    for (const toolCall of response.message.tool_calls) {
      switch (toolCall.function.name) {
        case "get_weather":
          // Extract the location parameter
          const helper = new llm.FunctionCallHelper(toolCall.function);
          const location = helper.get("location") || "";
          // Call your weather API or service
          const weather = await this.getWeather(location);
          // You would typically send this information back to the LLM in a follow-up message
          break;
      }
    }

    return response;
  }

  // Mock function for getting weather
  private async getWeather(location: string): Promise<string> {
    return `Weather in ${location}: Sunny, 72°F`;
  }
}
```

#### Complete Tool Usage Example

Here's a more complete example showing how to handle tool calls and continue the conversation:

```typescript
import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

export default class {
  @update([IDL.Text], IDL.Text)
  async handleChatWithTools(userMessage: string): Promise<string> {
    let messages: llm.ChatMessage[] = [
      llm.createSystemMessage("You are a helpful assistant"),
      llm.createUserMessage(userMessage)
    ];

    const tools = [
      llm.tool("get_weather")
        .withDescription("Get current weather for a location")
        .withParameter(
          llm.parameter("location", llm.ParameterType.String)
            .withDescription("The location to get weather for")
            .isRequired()
        )
        .build(),
      llm.tool("get_icp_price")
        .withDescription("Get the current ICP token price")
        .build()
    ];

    const response = await llm.chat(llm.Model.Llama3_1_8B)
      .withMessages(messages)
      .withTools(tools)
      .send();

    // Check if LLM wants to use tools
    if (response.message.tool_calls.length > 0) {
      // Add assistant message with tool calls
      messages.push(llm.createAssistantMessage(
        response.message.content,
        response.message.tool_calls
      ));

      // Process each tool call
      for (const toolCall of response.message.tool_calls) {
        const helper = new llm.FunctionCallHelper(toolCall.function);
        let toolResult: string;

        switch (toolCall.function.name) {
          case "get_weather":
            const location = helper.get("location") || "";
            toolResult = await this.getWeather(location);
            break;
          case "get_icp_price":
            toolResult = await this.getIcpPrice();
            break;
          default:
            toolResult = `Unknown tool: ${toolCall.function.name}`;
        }

        // Add tool result to conversation
        messages.push(llm.createToolMessage(toolResult, toolCall.id));
      }

      // Get final response from LLM with tool results
      const finalResponse = await llm.chat(llm.Model.Llama3_1_8B)
        .withMessages(messages)
        .send();

      return finalResponse.message.content || "";
    } else {
      // No tool calls needed, return direct response
      return response.message.content || "";
    }
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

## API Reference

### Models

- `Model.Llama3_1_8B` - The Llama 3.1 8B model

### Core Functions

- `prompt(model: Model, promptStr: string): Promise<string>` - Send a single message
- `chat(model: Model): ChatBuilder` - Create a chat builder for complex interactions
- `tool(name: string): ToolBuilder` - Create a tool builder
- `parameter(name: string, type: ParameterType): ParameterBuilder` - Create a parameter builder

### Message Creators

- `createUserMessage(content: string): ChatMessage`
- `createSystemMessage(content: string): ChatMessage`
- `createAssistantMessage(content?: string, toolCalls?: ToolCall[]): ChatMessage`
- `createToolMessage(content: string, toolCallId: string): ChatMessage`

### Parameter Types

- `ParameterType.String` - String parameter
- `ParameterType.Number` - Numeric parameter
- `ParameterType.Boolean` - Boolean parameter

### Builders

#### ChatBuilder
- `withMessages(messages: ChatMessage[]): ChatBuilder`
- `withTools(tools: Tool[]): ChatBuilder`
- `send(): Promise<Response>`

#### ToolBuilder
- `withDescription(description: string): ToolBuilder`
- `withParameter(parameter: ParameterBuilder): ToolBuilder`
- `build(): Tool`

#### ParameterBuilder
- `withDescription(description: string): ParameterBuilder`
- `isRequired(): ParameterBuilder`
- `withEnumValues(values: string[]): ParameterBuilder`

## Error Handling

```typescript
try {
  const response = await llm.chat(llm.Model.Llama3_1_8B)
    .withMessages([llm.createUserMessage("Hello")])
    .send();
  
  console.log(response.message.content);
} catch (error) {
  console.error("LLM request failed:", error);
}
```
