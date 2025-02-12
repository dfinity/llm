use candid::{CandidType, Principal};

const LLM_CANISTER: &str = "w36hm-eqaaa-aaaal-qr76a-cai";

#[derive(CandidType, Clone)]
struct Request {
    prompt: String,
    model: String,
}

pub async fn prompt<P: ToString>(prompt_str: P) -> String {
    let llm_canister = Principal::from_text(LLM_CANISTER).expect("invalid canister id");

    let res: (String,) = ic_cdk::call(
        llm_canister,
        "v0_prompt",
        (Request {
            prompt: prompt_str.to_string(),
            model: "ds".to_string(),
        },),
    )
    .await
    .unwrap();
    res.0
}
