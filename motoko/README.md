# `mo:llm`

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
      "type": "motoko"
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

```
mops add llm
```

## Usage

### Prompting (single message)

The simplest way to interact with a model is by sending a single prompt:

```motoko
import LLM "mo:llm";

actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt);
  };
}
```

### Chatting (multiple messages)

For more complex interactions, you can send multiple messages in a conversation:

```motoko
import LLM "mo:llm";

actor {
  public func example() {
    let response = await LLM.chat(#Llama3_1_8B).withMessages([
      #system_ {
        content = "You are a helpful assistant.";
      },
      #user {
        content = "How big is the sun?";
      },
    ]).send();
  };
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

```motoko
import LLM "mo:llm";

actor {
  public func example() {
    let response = await LLM.chat(#Llama3_1_8B)
      .withMessages([
        #system_ {
          content = "You are a helpful assistant."
        },
        #user {
          content = "What's the weather in San Francisco?"
        },
      ])
      .withTools([LLM.tool("get_weather")
        .withDescription("Get current weather for a location")
        .withParameter(
          LLM.parameter("location", #String)
            .withDescription("The location to get weather for")
            .isRequired()
        )
        .build()
      ])
      .send();
  };
}
```

#### Handling Tool Calls from the LLM

When the LLM decides to use one of your tools, you need to handle the tool call and provide the result:

```motoko
import LLM "mo:llm";
import Debug "mo:base/Debug";

actor {
  public func handleChat(userMessage : Text) : async Text {
    let response = await LLM.chat(#Llama3_1_8B)
      .withMessages([
        #system_ {
          content = "You are a helpful assistant."
        },
        #user {
          content = userMessage
        },
      ])
      .withTools([
        LLM.tool("get_weather")
          .withDescription("Get current weather for a location")
          .withParameter(
            LLM.parameter("location", #String)
              .withDescription("The location to get weather for")
              .isRequired()
          )
          .build(),
        LLM.tool("get_icp_price")
          .withDescription("Get the current ICP token price")
          .build()
      ])
      .send();
    
    // Check if the LLM wants to use any tools
    switch (response.message.tool_calls.size()) {
      case (0) {
        // No tool calls - LLM provided a direct response
        switch (response.message.content) {
          case (?content) { content };
          case null { "No response received" };
        }
      };
      case (_) {
        // Process tool calls
        var toolResults : [LLM.ChatMessage] = [];
        
        for (toolCall in response.message.tool_calls.vals()) {
          let result = switch (toolCall.function.name) {
            case ("get_weather") {
              let location = getToolParameter(toolCall.function.arguments, "location");
              await getWeather(location)
            };
            case ("get_icp_price") {
              await getIcpPrice()
            };
            case (_) {
              "Unknown tool: " # toolCall.function.name
            };
          };
          
          // Add tool result to conversation
          toolResults := Array.append(toolResults, [#tool {
            content = result;
            tool_call_id = toolCall.id;
          }]);
        };
        
        // Send tool results back to LLM for final response
        let finalResponse = await LLM.chat(#Llama3_1_8B)
          .withMessages(Array.append([
            #system_ { content = "You are a helpful assistant." },
            #user { content = userMessage },
            #assistant(response.message)
          ], toolResults))
          .send();
          
        switch (finalResponse.message.content) {
          case (?content) { content };
          case null { "No final response received" };
        }
      };
    }
  };

  // Helper function to extract parameter values
  private func getToolParameter(arguments : [LLM.ToolCallArgument], paramName : Text) : Text {
    for (arg in arguments.vals()) {
      if (arg.name == paramName) {
        return arg.value;
      };
    };
    ""
  };

  // Example tool implementations
  private func getWeather(location : Text) : async Text {
    // In a real implementation, you would call a weather API
    "Weather in " # location # ": Sunny, 72°F"
  };

  private func getIcpPrice() : async Text {
    // In a real implementation, you would call a price API
    "Current ICP price: $10.50"
  };
}
```
