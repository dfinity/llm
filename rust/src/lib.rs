//! A library for making requests to the LLM canister on the Internet Computer.
use std::fmt;

// Define our modules
mod chat;
mod tool;

// Re-export public types from modules
pub use chat::{AssistantMessage, ChatBuilder, ChatMessage, FunctionCall, Response, ToolCall};
pub use tool::{
    Function, ParameterBuilder, ParameterType, Parameters, Property, Tool, ToolBuilder,
};

// The principal of the LLM canister.
const LLM_CANISTER: &str = "w36hm-eqaaa-aaaal-qr76a-cai";

/// Supported LLM models.
#[derive(Debug)]
pub enum Model {
    Llama3_1_8B,
}

impl fmt::Display for Model {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let text = match self {
            Model::Llama3_1_8B => "llama3.1:8b",
        };
        write!(f, "{}", text)
    }
}

/// Sends a single message to a model.
///
/// # Example
///
/// ```
/// use ic_llm::Model;
///
/// # async fn prompt_example() -> String {
/// ic_llm::prompt(Model::Llama3_1_8B, "What's the speed of light?").await
/// # }
/// ```
pub async fn prompt<P: ToString>(model: Model, prompt_str: P) -> String {
    let response = ChatBuilder::new(model)
        .with_messages(vec![ChatMessage::User {
            content: prompt_str.to_string(),
        }])
        .send()
        .await;

    response.message.content.unwrap_or_default()
}

/// Creates a new ChatBuilder with the specified model.
///
/// This is a convenience function that returns a ChatBuilder instance initialized with the given model.
/// You can then chain additional methods to configure the chat request before sending it.
///
/// # Example
///
/// ```
/// use ic_llm::{Model, ChatMessage, Response};
///
/// # async fn chat_example() -> Response {
/// // Basic usage
/// ic_llm::chat(Model::Llama3_1_8B)
///     .with_messages(vec![
///         ChatMessage::System {
///             content: "You are a helpful assistant".to_string(),
///         },
///         ChatMessage::User {
///             content: "How big is the sun?".to_string(),
///         },
///     ])
///     .send()
///     .await
/// # }
/// ```
///
/// You can also add tools to the chat:
///
/// ```
/// use ic_llm::{Model, ChatMessage, ParameterType, Response};
///
/// # async fn chat_with_tools_example() -> Response {
/// ic_llm::chat(Model::Llama3_1_8B)
///     .with_messages(vec![
///         ChatMessage::System {
///             content: "You are a helpful assistant".to_string(),
///         },
///         ChatMessage::User {
///             content: "What's the balance of account abc123?".to_string(),
///         },
///     ])
///     .with_tools(vec![
///         ic_llm::tool("icp_account_balance")
///             .with_description("Lookup the balance of an ICP account")
///             .with_parameter(
///                 ic_llm::ParameterBuilder::new("account", ParameterType::String)
///                     .with_description("The ICP account to look up")
///                     .is_required()
///             )
///             .build()
///     ])
///     .send()
///     .await
/// # }
/// ```
pub fn chat(model: Model) -> ChatBuilder {
    ChatBuilder::new(model)
}

/// Creates a new ToolBuilder with the specified name.
///
/// This is a convenience function that returns a ToolBuilder instance initialized with the given name.
/// You can then chain additional methods to configure the tool before building it.
///
/// # Example
///
/// ```
/// use ic_llm::{ParameterType, Response};
///
/// # fn tool_example() {
/// // Basic usage
/// let weather_tool = ic_llm::tool("get_weather")
///     .with_description("Get current weather for a location")
///     .with_parameter(
///         ic_llm::ParameterBuilder::new("location", ParameterType::String)
///             .with_description("The location to get weather for")
///             .is_required()
///     )
///     .build();
/// # }
/// ```
pub fn tool<S: Into<String>>(name: S) -> ToolBuilder {
    ToolBuilder::new(name)
}
