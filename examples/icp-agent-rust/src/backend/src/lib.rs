use ic_llm::{ChatMessage, Model, Role};
use ic_ledger_types::{AccountIdentifier, AccountBalanceArgs, MAINNET_LEDGER_CANISTER_ID, account_balance};

const SYSTEM_PROMPT: &str = "You are an assistant that specializes in looking up the balance of ICP accounts.

Follow these steps rigorously:

1. Request Phase
- If user asks about a balance without providing an account, or asks about their balance, respond:
  \"Please provide an ICP account (64-character hexadecimal string).\"
- If the user asks about their balance or account, respond:
  \"Please provide an ICP account, and I'll look up its balance.\"
- If the user asks an unrelated question, respond:
  \"I can only help with ICP account balances. Please provide an ICP account for me to look up its balance.\"


2. Execution Phase
- For valid accounts: Return EXACTLY \"LOOKUP({ACCOUNT})\" 
- Never add explanations, formatting, or extra text in this phase
";


#[ic_cdk::update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}

#[ic_cdk::update]
async fn chat_raw(messages: Vec<ChatMessage>) -> String {
    let mut all_messages = vec![ChatMessage {
        role: Role::System,
        content: SYSTEM_PROMPT.to_string(),
    }];
    all_messages.extend(messages);
    let messages = all_messages;

    ic_llm::chat(
        Model::Llama3_1_8B,
        messages,
    )
    .await
}

async fn lookup_account(account: &str) -> String {
    if account.len() != 64 {
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
            //format!("TODO: Balance of {} is 100 ICP", account)
        }
        Err(_) => "Invalid account".to_string(),
    }
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    let mut all_messages = vec![ChatMessage {
        role: Role::System,
        content: SYSTEM_PROMPT.to_string(),
    }];
    all_messages.extend(messages);
    let messages = all_messages;

    let answer = ic_llm::chat(
        Model::Llama3_1_8B,
        messages,
    )
    .await;

    if answer.starts_with("LOOKUP(") {
        // Extract the account from LOOKUP(account)
        let account = answer
            .trim_start_matches("LOOKUP(")
            .trim_end_matches(")");
        
        lookup_account(&account).await
    } else {
        answer
    }
}
