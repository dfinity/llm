use crate::tool::Tool;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

// The mainnet principal of the LLM canister.
const MAINNET_LLM_CANISTER: &str = "w36hm-eqaaa-aaaal-qr76a-cai";

// Resolves the LLM canister to call.
//
// Prefers the `PUBLIC_CANISTER_ID:llm` environment variable (auto-injected by
// `icp deploy` so the library targets the local `llm` canister during
// development) and otherwise falls back to the mainnet canister.
fn default_llm_canister() -> Principal {
    // The env-var lookup only works in a canister; skip in unit tests.
    #[cfg(not(test))]
    {
        const LLM_CANISTER_ENV: &str = "PUBLIC_CANISTER_ID:llm";
        if ic_cdk::api::env_var_name_exists(LLM_CANISTER_ENV) {
            let id = ic_cdk::api::env_var_value(LLM_CANISTER_ENV);
            return Principal::from_text(&id)
                .unwrap_or_else(|e| ic_cdk::trap(format!("invalid {LLM_CANISTER_ENV}: {e}")));
        }
    }
    Principal::from_text(MAINNET_LLM_CANISTER).unwrap()
}

/// A message in a chat.
#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ChatMessage {
    #[serde(rename = "user")]
    User { content: String },
    #[serde(rename = "system")]
    System { content: String },
    #[serde(rename = "assistant")]
    Assistant(AssistantMessage),
    #[serde(rename = "tool")]
    Tool {
        content: String,
        tool_call_id: String,
    },
}

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct Response {
    pub message: AssistantMessage,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct AssistantMessage {
    pub content: Option<String>,
    pub tool_calls: Vec<ToolCall>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ToolCall {
    pub id: String,
    pub function: FunctionCall,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct FunctionCall {
    pub name: String,
    pub arguments: Vec<ToolCallArgument>,
}

impl FunctionCall {
    pub fn get(&self, argument: &str) -> Option<String> {
        self.arguments
            .iter()
            .find(|arg| arg.name == argument)
            .map(|arg| arg.value.clone())
    }
}

/// An argument to be provided to a tool.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ToolCallArgument {
    pub name: String,
    pub value: String,
}

// Internal request type sent to the canister
#[derive(CandidType, Serialize, Deserialize, Debug)]
struct Request {
    model: String,
    messages: Vec<ChatMessage>,
    tools: Option<Vec<Tool>>,
}

/// Cycles attached to a `v1_chat` call when the caller opts in via
/// [`ChatBuilder::with_cycles`].
///
/// Paid models require a minimum of 100B cycles to accept a request; they
/// charge only what the request costs and refund the remainder. Free models
/// accept no cycles.
const CYCLES_PER_CHAT: u128 = 100_000_000_000;

/// Deadline (in seconds) for a `v1_chat` call.
const CHAT_TIMEOUT_SECONDS: u32 = 300;

/// Builder for creating and sending chat requests to the LLM canister.
#[derive(Debug)]
pub struct ChatBuilder {
    model: String,
    messages: Vec<ChatMessage>,
    tools: Vec<Tool>,
    attach_cycles: bool,
}

impl ChatBuilder {
    /// Creates a new chat builder with a model.
    ///
    /// `model` is the canister's model identifier, e.g. `"llama3.1:8b"` (free)
    /// or `"gemma3:27b"` (paid). See the [Intelligence Gateway](https://inference.internetcomputer.org/)
    /// for the current list.
    pub fn new(model: impl Into<String>) -> Self {
        Self {
            model: model.into(),
            messages: Vec::new(),
            tools: Vec::new(),
            attach_cycles: false,
        }
    }

    /// Sets the messages for the chat.
    pub fn with_messages(mut self, messages: Vec<ChatMessage>) -> Self {
        self.messages = messages;
        self
    }

    /// Sets the tools for the chat.
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self {
        self.tools = tools;
        self
    }

    /// Attaches cycles to the request (100B cycles).
    ///
    /// Call this when you want to pay for models using attached cycles. By
    /// default, no cycles are attached and your request is charged against the
    /// canister's balance on IIG.
    ///
    /// Paid models charge only what the request costs and refund the remainder;
    /// free models accept no cycles. Note that the calling canister must hold at
    /// least 100B cycles when `send()` runs, otherwise the call traps.
    pub fn with_cycles(mut self) -> Self {
        self.attach_cycles = true;
        self
    }

    /// Sends the chat request to the LLM canister.
    ///
    /// Attaches cycles only when [`with_cycles`](Self::with_cycles) was called;
    /// otherwise the request is charged against the canister's balance on IIG.
    pub async fn send(self) -> Response {
        let tools_option = if self.tools.is_empty() {
            None
        } else {
            Some(self.tools)
        };

        let cycles_to_attach = if self.attach_cycles {
            CYCLES_PER_CHAT
        } else {
            0
        };

        ic_cdk::call::Call::bounded_wait(default_llm_canister(), "v1_chat")
            .change_timeout(CHAT_TIMEOUT_SECONDS)
            .with_cycles(cycles_to_attach)
            .with_arg(Request {
                model: self.model,
                messages: self.messages,
                tools: tools_option,
            })
            .await
            .unwrap_or_else(|e| ic_cdk::trap(format!("LLM call failed: {e:?}")))
            .candid()
            .unwrap_or_else(|e| ic_cdk::trap(format!("failed to decode LLM response: {e:?}")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tool::ToolBuilder;

    #[test]
    fn create_chat_builder() {
        let builder = ChatBuilder::new("llama3.1:8b");
        assert!(builder.messages.is_empty());
        assert!(builder.tools.is_empty());
    }

    #[test]
    fn chat_builder_with_messages() {
        let messages = vec![
            ChatMessage::System {
                content: "You are a helpful assistant".to_string(),
            },
            ChatMessage::User {
                content: "Hello".to_string(),
            },
        ];

        let builder = ChatBuilder::new("llama3.1:8b").with_messages(messages.clone());

        assert_eq!(builder.messages, messages);
        assert!(builder.tools.is_empty());
    }

    #[test]
    fn chat_builder_with_tools() {
        let tool = ToolBuilder::new("test_tool")
            .with_description("A test tool")
            .build();

        let builder = ChatBuilder::new("llama3.1:8b").with_tools(vec![tool.clone()]);

        assert!(builder.messages.is_empty());
        assert_eq!(builder.tools.len(), 1);
        assert_eq!(builder.tools[0], tool);
    }

    #[test]
    fn chat_builder_defaults_to_no_cycles() {
        let builder = ChatBuilder::new("llama3.1:8b");
        assert!(!builder.attach_cycles);
    }

    #[test]
    fn chat_builder_with_cycles() {
        let builder = ChatBuilder::new("llama3.1:8b").with_cycles();
        assert!(builder.attach_cycles);
    }

    #[test]
    fn chat_builder_with_messages_and_tools() {
        let messages = vec![ChatMessage::User {
            content: "Hello".to_string(),
        }];

        let tool = ToolBuilder::new("test_tool").build();

        let builder = ChatBuilder::new("llama3.1:8b")
            .with_messages(messages.clone())
            .with_tools(vec![tool.clone()]);

        assert_eq!(builder.messages, messages);
        assert_eq!(builder.tools.len(), 1);
        assert_eq!(builder.tools[0], tool);
    }

    #[test]
    fn function_call_get() {
        let function_call = FunctionCall {
            name: "test_function".to_string(),
            arguments: vec![
                ToolCallArgument {
                    name: "arg1".to_string(),
                    value: "value1".to_string(),
                },
                ToolCallArgument {
                    name: "arg2".to_string(),
                    value: "value2".to_string(),
                },
            ],
        };

        assert_eq!(function_call.get("arg1"), Some("value1".to_string()));
        assert_eq!(function_call.get("arg2"), Some("value2".to_string()));
        assert_eq!(function_call.get("arg3"), None);
    }
}
