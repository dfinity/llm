//! A library for making requests to the LLM canister on the Internet Computer.
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::fmt;

// The principal of the LLM canister.
const LLM_CANISTER: &str = "w36hm-eqaaa-aaaal-qr76a-cai";

#[derive(CandidType, Serialize, Deserialize, Debug)]
struct Request {
    model: String,
    messages: Vec<ChatMessage>,
}

/// The role of a `ChatMessage`.
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum Role {
    #[serde(rename = "system")]
    System,
    #[serde(rename = "user")]
    User,
}

/// A message in a chat.
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct ChatMessage {
    pub role: Role,
    pub content: String,
}

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
    let llm_canister = Principal::from_text(LLM_CANISTER).expect("invalid canister id");

    let res: (String,) = ic_cdk::call(
        llm_canister,
        "v0_chat",
        (Request {
            model: model.to_string(),
            messages: vec![ChatMessage {
                role: Role::User,
                content: prompt_str.to_string(),
            }],
        },),
    )
    .await
    .unwrap();
    res.0
}

/// Sends a list of messages to a model.
///
/// # Example
///
/// ```
/// use ic_llm::{Model, ChatMessage, Role};
///
/// # async fn chat_example() -> String {
/// ic_llm::chat(
///     Model::Llama3_1_8B,
///     vec![
///         ChatMessage {
///             role: Role::System,
///             content: "You are a helpful assistant".to_string(),
///         },
///         ChatMessage {
///             role: Role::User,
///             content: "How big is the sun?".to_string(),
///         },
///     ],
/// )
/// .await
/// # }
/// ```
pub async fn chat(model: Model, messages: Vec<ChatMessage>) -> String {
    let llm_canister = Principal::from_text(LLM_CANISTER).expect("invalid canister id");

    let res: (String,) = ic_cdk::call(
        llm_canister,
        "v0_chat",
        (Request {
            model: model.to_string(),
            messages,
        },),
    )
    .await
    .unwrap();
    res.0
}
