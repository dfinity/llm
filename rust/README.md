A library for making requests to the LLM canister on the Internet Computer.

## Supported Models

The following LLM models are available:

- `Model::Llama3_1_8B` - Llama 3.1 8B model
- `Model::Qwen3_32B` - Qwen 3 32B model  
- `Model::Llama4Scout` - Llama 4 Scout model

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
