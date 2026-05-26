use crate::tool::Tool;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

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

/// Builder for creating and sending chat requests to the LLM canister.
#[derive(Debug)]
pub struct ChatBuilder {
    model: crate::Model,
    messages: Vec<ChatMessage>,
    tools: Vec<Tool>,
    canister: Option<Principal>,
}

impl ChatBuilder {
    /// Creates a new chat builder with a model.
    pub fn new(model: crate::Model) -> Self {
        Self {
            model,
            messages: Vec::new(),
            tools: Vec::new(),
            canister: None,
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

    /// Overrides the LLM canister to call.
    ///
    /// By default the SDK addresses the mainnet LLM canister
    /// (`w36hm-eqaaa-aaaal-qr76a-cai`), unless `icp deploy` has auto-injected
    /// `PUBLIC_CANISTER_ID:llm` on this canister — in which case that value is
    /// used. Set this only when neither default is what you want (e.g. when
    /// pointing at a fork, a mock, or a staging deployment under a different
    /// name).
    pub fn with_canister(mut self, canister: Principal) -> Self {
        self.canister = Some(canister);
        self
    }

    /// Sends the chat request to the LLM canister.
    pub async fn send(self) -> Response {
        let llm_canister = self.canister.unwrap_or_else(crate::default_llm_canister);

        let tools_option = if self.tools.is_empty() {
            None
        } else {
            Some(self.tools)
        };

        ic_cdk::call::Call::bounded_wait(llm_canister, "v1_chat")
            .with_arg(Request {
                model: self.model.to_string(),
                messages: self.messages,
                tools: tools_option,
            })
            .await
            .expect("call to LLM canister failed")
            .candid()
            .expect("failed to decode LLM canister response")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tool::ToolBuilder;
    use crate::Model;

    #[test]
    fn create_chat_builder() {
        let builder = ChatBuilder::new(Model::Llama3_1_8B);
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

        let builder = ChatBuilder::new(Model::Llama3_1_8B).with_messages(messages.clone());

        assert_eq!(builder.messages, messages);
        assert!(builder.tools.is_empty());
    }

    #[test]
    fn chat_builder_with_tools() {
        let tool = ToolBuilder::new("test_tool")
            .with_description("A test tool")
            .build();

        let builder = ChatBuilder::new(Model::Llama3_1_8B).with_tools(vec![tool.clone()]);

        assert!(builder.messages.is_empty());
        assert_eq!(builder.tools.len(), 1);
        assert_eq!(builder.tools[0], tool);
    }

    #[test]
    fn chat_builder_with_canister() {
        let canister = Principal::from_slice(&[1, 2, 3, 4]);
        let builder = ChatBuilder::new(Model::Llama3_1_8B).with_canister(canister);
        assert_eq!(builder.canister, Some(canister));
    }

    #[test]
    fn chat_builder_with_messages_and_tools() {
        let messages = vec![ChatMessage::User {
            content: "Hello".to_string(),
        }];

        let tool = ToolBuilder::new("test_tool").build();

        let builder = ChatBuilder::new(Model::Llama3_1_8B)
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
