use ic_llm::ChatMessage;

#[ic_cdk::update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt("llama3.1:8b", prompt_str).await
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    let response = ic_llm::chat("llama3.1:8b")
        .with_messages(messages)
        .send()
        .await;

    // A response can contain tool calls, but we're not calling tools in this project,
    // so we can return the response message directly.
    response.message.content.unwrap_or_default()
}
