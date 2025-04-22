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
}

impl ChatBuilder {
    /// Creates a new chat builder with a model.
    pub fn new(model: crate::Model) -> Self {
        Self {
            model,
            messages: Vec::new(),
            tools: Vec::new(),
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

    /// Sends the chat request to the LLM canister.
    pub async fn send(self) -> Response {
        let llm_canister = Principal::from_text(crate::LLM_CANISTER).expect("invalid canister id");

        let tools_option = if self.tools.is_empty() {
            None
        } else {
            Some(self.tools)
        };

        let res: (Response,) = ic_cdk::call(
            llm_canister,
            "v1_chat",
            (Request {
                model: self.model.to_string(),
                messages: self.messages,
                tools: tools_option,
            },),
        )
        .await
        .unwrap();

        res.0
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
