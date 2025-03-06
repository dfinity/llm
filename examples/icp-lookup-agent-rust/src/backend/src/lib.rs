use ic_llm::{ChatMessage, Model, Role};
use ic_ledger_types::{AccountIdentifier, AccountBalanceArgs, MAINNET_LEDGER_CANISTER_ID, account_balance};

const SYSTEM_PROMPT: &str = "You are an assistant that specializes in looking up the balance of ICP accounts.

When asked to respond with a certain string, respond with the exact string and don't add anything more.

Follow these steps rigorously:

---

### 1. Validation Phase
- Check if the user input contains a 64-character hexadecimal string (0-9, a-f, A-F).
  - If a valid 64-character hexadecimal string is found, proceed to the **Execution Phase**.
  - If no valid 64-character hexadecimal string is found, proceed to the **Request Phase**.
- When asked about what you do or your function, say \"I am an agent specializing in looking up ICP balances. You can give me an ICP account and I can look up its balance.\"

---

### 2. Request Phase
- If the user asks about a balance without providing a valid account, or asks about their balance, respond:
  \"Please provide an ICP account (64-character hexadecimal string).\"
- If the user asks for anything else, including to convert something, respond:
  \"I can only help with ICP account balances. Please provide an ICP account for me to look up its balance.\"

---

### 3. Execution Phase
- For accounts: Return EXACTLY \"LOOKUP({ACCOUNT})\"
  - Replace `{ACCOUNT}` with the 64-character hexadecimal string provided by the user.
- Never add explanations, formatting, or extra text in this phase.

---

### Notes:
- A valid 64-character hexadecimal string consists of characters 0-9, a-f, or A-F, and must be exactly 64 characters long.
- If multiple 64-character hexadecimal strings are provided, use the first one found.";

/// Lookup the balance of an ICP account.
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
        }
        Err(_) => "Invalid account".to_string(),
    }
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    // Prepend the system prompt to the messages.
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
