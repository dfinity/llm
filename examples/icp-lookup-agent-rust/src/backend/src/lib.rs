use ic_llm::{ChatMessage, Model, tool, ParameterType};
use ic_ledger_types::{AccountIdentifier, AccountBalanceArgs, MAINNET_LEDGER_CANISTER_ID, account_balance};

const SYSTEM_PROMPT: &str = r#"You are an assistant that exclusively performs ICP balance lookups.
Use the 'lookup_icp_balance' tool when asked for an account balance and report the balance back to the user.
If the user asks about anything else, politely inform them that you can only look up ICP balances and offer to perform a lookup."#;

const MODEL: Model = Model::Qwen3_32B;

/// Lookup the balance of an ICP account.
async fn lookup_account(account: &str) -> String {
    if account.len() != 64 {
        ic_cdk::println!("Account must be 64 characters long but got {} for input \"{}\"", account.len(), account);
        return "Account must be 64 characters long".to_string();
    }

    match AccountIdentifier::from_hex(account) {
        Ok(account) => {
            let balance = account_balance(
                MAINNET_LEDGER_CANISTER_ID,
                AccountBalanceArgs {
                    account,
                }
            ).await.expect("call to ledger failed");

            format!("Balance of {} is {} ICP", account, balance)
        }
        Err(_) => "Invalid account".to_string(),
    }
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    // Prepend the system prompt to the messages.
    let mut all_messages = vec![ChatMessage::System {
        content: SYSTEM_PROMPT.to_string(),
    }];
    all_messages.extend(messages);

    let tools = vec![
        tool("lookup_icp_balance")
            .with_description("Lookup the balance of an ICP account.")
            .with_parameter(
                ic_llm::parameter("account", ParameterType::String)
                    .with_description("The ICP account (64-character hex string) to look up.")
                    .is_required()
            )
            .build()
    ];

    let chat = ic_llm::chat(MODEL)
        .with_messages(all_messages.clone())
        .with_tools(tools);

    let response = chat.send().await;

    // Check if LLM wants to use tools
    if !response.message.tool_calls.is_empty() {
        // Add assistant message with tool calls
        all_messages.push(ChatMessage::Assistant(response.message.clone()));

        // Process each tool call
        for tool_call in &response.message.tool_calls {
            ic_cdk::println!("tool_call: {:?}", tool_call);
            let tool_result = match tool_call.function.name.as_str() {
                "lookup_icp_balance" => {
                    let account = tool_call.function.get("account").expect("account is required");
                    lookup_account(&account).await
                }
                _ => format!("Unknown tool: {}", tool_call.function.name)
            };

            ic_cdk::println!("tool_result: {:?}", tool_result);

            // Add tool result to conversation
            all_messages.push(ChatMessage::Tool {
                content: tool_result,
                tool_call_id: tool_call.id.clone(),
            });
        }

        // Get final response from LLM with tool results
        let final_response = ic_llm::chat(MODEL)
            .with_messages(all_messages)
            .send()
            .await;

        ic_cdk::println!("final_response: {:?}", final_response);

        final_response.message.content.unwrap_or_default()
    } else {
        // No tool calls needed, return direct response
        ic_cdk::println!("response without tool calls: {:?}", response);
        response.message.content.unwrap_or_default()
    }
}
