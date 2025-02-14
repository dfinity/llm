use candid::{CandidType, Principal};
use serde::Serialize;
use std::fmt;
use ic_cdk::api::{call::call, caller};

const LLM_CANISTER: &str = "w36hm-eqaaa-aaaal-qr76a-cai";

#[derive(CandidType, Serialize)]
struct Request {
    model: String,
    messages: Vec<ChatMessage>,
}

#[derive(CandidType, Serialize)]
pub enum Role {
    #[serde(rename = "system")]
    System,
    #[serde(rename = "user")]
    User,
}

#[derive(CandidType, Serialize)]
pub struct ChatMessage {
    pub role: Role,
    pub content: String,
}

// TODO: use this
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

/// Send a single prompt to a model.
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

/// Send a list of messages to a model.
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
