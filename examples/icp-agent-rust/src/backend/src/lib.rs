use candid::{CandidType, Principal};
use ic_cdk::api::{call::call, caller};
use ic_ledger_types::{
    account_balance, AccountBalanceArgs, AccountIdentifier, Tokens, DEFAULT_SUBACCOUNT,
    MAINNET_LEDGER_CANISTER_ID,
};
use ic_llm::{ChatMessage, Model, Role};
use std::fmt;

async fn check_balance(account: &str) -> Tokens {
    account_balance(
        MAINNET_LEDGER_CANISTER_ID,
        AccountBalanceArgs {
            account: AccountIdentifier::from_hex(account).unwrap(),
        },
    )
    .await
    .expect("call to ledger failed")
}

#[ic_cdk::update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}

const SYSTEM_PROMPT: &str = r#"You are an assistant who is able to lookup the balances of ICP tokens.

You support the following actions:

1. Looking up the balance of an account

The user can request the balance of an ICP address, return \"LOOKUP_HEX: {ADDRESS}\" where ADDRESS is a 64-character hex string. Examples:

dc9333fb93f61ea933816429ca74bc745d7d47cb4788e70ed9442672f6bf8899
4cea06e06c82d7e818c212cd55076ad958475608ed982819d64bce06bfefad07

2. Looking up the balance of a "principal" and a "subaccount".

The user can request the balance of an ICP address, and provides a "principal" return "LOOKUP_PRINCIPAL(principal, subaccount)".

- "principal" consists of characters separated by hyphens. Examples:

ut6oh-icu54-nm6rq-go6mt-m242r-lmqyn-4k5ji-c65yo-txz6n-aow7w-6qe
kjapl-4blje-ikqfv-ntnwp-xwmis-nkw6q-ybow3-gcgar-fzkab-rbgvq-7qe

If it doesn't contain hyphens, return an error saying 'No principal provided.'

- A "subaccount" is a positive integer. It's optional. If none is provided use "None".

Only return accounts and principals mentioned in the user's prompt.

If the user doesn't provide all the information, request that they provide it again.

For any other request, say that 'I'm an agent that can only be used for looking up ICP balances.
"#;

#[ic_cdk::update]
async fn chat(prompt: String) -> String {
    let answer = ic_llm::chat(
        Model::Llama3_1_8B,
        vec![
            ChatMessage {
                role: Role::System,
                content: SYSTEM_PROMPT.to_string(),
            },
            ChatMessage {
                role: Role::User,
                content: prompt,
            },
        ],
    )
    .await;

    /*if answer.starts_with("LOOKUP: ") {
        let address = answer.split(' ').collect::<Vec<&str>>()[1];
        //ic_cdk::println!("Lookup address: {}", address);
        //let tokens = check_balance(address).await;
        //ic_cdk::println!("balance: {:?}", tokens);
        return format!("TODO: lookup address: {}", address);
    }*/

    answer
}
