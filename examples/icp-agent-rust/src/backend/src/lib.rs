use candid::{CandidType, Principal};
use ic_cdk::api::{call::call, caller};
use ic_ledger_types::{
    account_balance, AccountBalanceArgs, AccountIdentifier, Tokens, DEFAULT_SUBACCOUNT,
    MAINNET_LEDGER_CANISTER_ID,
};
use ic_llm::{ChatMessage, Model, Role};
use std::fmt;

#[ic_cdk::update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    ic_llm::chat(
        Model::Llama3_1_8B,
        messages,
    )
    .await
}
