# `ic-llm`

A library for making requests to the LLM canister on the Internet Computer.

## Supported Models

Models are identified by their string name (passed to `ic_llm::prompt` and
`ic_llm::chat`). See the [Intelligence Gateway Homepage](https://inference.internetcomputer.org/) for the authoritative, up-to-date list.

## Examples

The simplest interaction is a single prompt, which returns the reply text
directly:

```rust
async fn example() -> String {
    ic_llm::prompt("llama3.1:8b", "Write a haiku about the Internet Computer.").await
}
```

For a multi-turn conversation, build a chat from a list of messages:

```rust
use ic_llm::ChatMessage;

async fn example() -> String {
    let response = ic_llm::chat("llama3.1:8b")
        .with_messages(vec![
            ChatMessage::System {
                content: "You are a helpful assistant for Internet Computer developers.".to_string(),
            },
            ChatMessage::User {
                content: "Suggest a fun name for my new canister.".to_string(),
            },
        ])
        .send()
        .await;

    response.message.content.unwrap_or_default()
}
```

To pay per request, attach cycles with `.with_cycles()` (see
[Paying for Models](#paying-for-models)):

```rust
use ic_llm::ChatMessage;

async fn example() {
    ic_llm::chat("gemma3:27b")
        .with_messages(vec![
            ChatMessage::System {
                content: "You are a helpful assistant for Internet Computer developers.".to_string(),
            },
            ChatMessage::User {
                content: "Suggest a fun name for my new canister.".to_string(),
            },
        ])
        .with_cycles()
        .send()
        .await;
}
```

## Paying for Models

Paying for inference can be done in two ways.

1. **Deposit cycles up front.** Add a cycles balance at
   [inference.internetcomputer.org](https://inference.internetcomputer.org). The
   LLM canister draws from that balance, so requests need no attached cycles —
   just call without `.with_cycles()`. This works on **both mainnet and cloud
   engines**.

2. **Attach cycles per request.** Call `.with_cycles()` on the builder and
   `send()` attaches 100B cycles (the model charges only what it needs and
   refunds the rest), **so the calling canister must hold at least 100B cycles or
   the call traps**. This works on **mainnet only** — cloud engine canisters
   cannot send cross-subnet messages that carry attached cycles.

## Local Development

The library resolves which `llm` canister to call at runtime, so the same code
works locally and on mainnet:

- **Mainnet:** it calls the canonical LLM canister
  (`w36hm-eqaaa-aaaal-qr76a-cai`), which requires no API key.
- **Locally:** `icp deploy` injects the local `llm` canister's principal as the
  `PUBLIC_CANISTER_ID:llm` environment variable and the library picks it up
  automatically. The local `llm` canister runs in `https` mode and needs an
  [Internet Intelligence Gateway](https://inference.internetcomputer.org/) API
  key to serve prompts.

See the [quickstart example](../examples/quickstart-agent-rust) for a complete
project — `icp.yaml`, deploying locally, and calling the agent.

## Install

```bash
cargo add ic-llm
```
