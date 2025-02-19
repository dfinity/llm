use ic_llm::{ChatMessage, Model};

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
