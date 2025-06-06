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
      "type": "rust",
      "package": "your_package_name"
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

## Usage

### Basic Usage

#### Prompting (Single Message)

The simplest way to interact with a model is by sending a single prompt:

```rust
use ic_llm::Model;

async fn example() -> String {
    ic_llm::prompt(Model::Llama3_1_8B, "What's the speed of light?").await
}
```

#### Chatting (Multiple Messages)

For more complex interactions, you can send multiple messages in a conversation:

```rust
use ic_llm::{Model, ChatMessage};

async fn example() {
    ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(vec![
            ChatMessage::System {
                content: "You are a helpful assistant".to_string(),
            },
            ChatMessage::User {
                content: "How big is the sun?".to_string(),
            },
        ])
        .send()
        .await;
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

```rust
use ic_llm::{Model, ChatMessage, ParameterType};

async fn example() {
    ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(vec![
            ChatMessage::System {
                content: "You are a helpful assistant".to_string(),
            },
            ChatMessage::User {
                content: "What's the balance of account abc123?".to_string(),
            },
        ])
        .with_tools(vec![
            ic_llm::tool("icp_account_balance")
                .with_description("Lookup the balance of an ICP account")
                .with_parameter(
                    ic_llm::parameter("account", ParameterType::String)
                        .with_description("The ICP account to look up")
                        .is_required()
                )
                .build()
        ])
        .send()
        .await;
}
```

#### Handling Tool Calls from the LLM

When the LLM decides to use one of your tools, you can handle the call:

```rust
use ic_llm::{Model, ChatMessage, ParameterType, Response};

async fn example() -> Response {
    let response = ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(vec![
            ChatMessage::System {
                content: "You are a helpful assistant".to_string(),
            },
            ChatMessage::User {
                content: "What's the weather in San Francisco?".to_string(),
            },
        ])
        .with_tools(vec![
            ic_llm::tool("get_weather")
                .with_description("Get current weather for a location")
                .with_parameter(
                    ic_llm::parameter("location", ParameterType::String)
                        .with_description("The location to get weather for")
                        .is_required()
                )
                .build()
        ])
        .send()
        .await;
    
    // Process tool calls if any
    for tool_call in &response.message.tool_calls {
        match tool_call.function.name.as_str() {
            "get_weather" => {
                // Extract the location parameter
                let location = tool_call.function.get("location").unwrap();
                // Call your weather API or service
                let weather = get_weather(&location).await;
                // You would typically send this information back to the LLM in a follow-up message
            }
            _ => {} // Handle other tool calls
        }
    }
    
    response
}

// Mock function for getting weather
async fn get_weather(location: &str) -> String {
    format!("Weather in {}: Sunny, 72°F", location)
}
```

#### Complete Tool Usage Example

Here's a more complete example showing how to handle tool calls and continue the conversation:

```rust
use ic_llm::{Model, ChatMessage, ParameterType, Response};

async fn handle_chat_with_tools(user_message: String) -> String {
    let mut messages = vec![
        ChatMessage::System {
            content: "You are a helpful assistant".to_string(),
        },
        ChatMessage::User {
            content: user_message,
        },
    ];

    let tools = vec![
        ic_llm::tool("get_weather")
            .with_description("Get current weather for a location")
            .with_parameter(
                ic_llm::parameter("location", ParameterType::String)
                    .with_description("The location to get weather for")
                    .is_required()
            )
            .build(),
        ic_llm::tool("get_icp_price")
            .with_description("Get the current ICP token price")
            .build()
    ];

    let response = ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(messages.clone())
        .with_tools(tools)
        .send()
        .await;

    // Check if LLM wants to use tools
    if !response.message.tool_calls.is_empty() {
        // Add assistant message with tool calls
        messages.push(ChatMessage::Assistant(response.message.clone()));

        // Process each tool call
        for tool_call in &response.message.tool_calls {
            let tool_result = match tool_call.function.name.as_str() {
                "get_weather" => {
                    let location = tool_call.function.get("location").unwrap_or_default();
                    get_weather(&location).await
                }
                "get_icp_price" => {
                    get_icp_price().await
                }
                _ => format!("Unknown tool: {}", tool_call.function.name)
            };

            // Add tool result to conversation
            messages.push(ChatMessage::Tool {
                content: tool_result,
                tool_call_id: tool_call.id.clone(),
            });
        }

        // Get final response from LLM with tool results
        let final_response = ic_llm::chat(Model::Llama3_1_8B)
            .with_messages(messages)
            .send()
            .await;

        final_response.message.content.unwrap_or_default()
    } else {
        // No tool calls needed, return direct response
        response.message.content.unwrap_or_default()
    }
}

// Example tool implementations
async fn get_weather(location: &str) -> String {
    // In a real implementation, you would call a weather API
    format!("Weather in {}: Sunny, 72°F", location)
}

async fn get_icp_price() -> String {
    // In a real implementation, you would call a price API
    "Current ICP price: $10.50".to_string()
}
```
