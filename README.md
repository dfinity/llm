# LLMs on the IC

This repo contains libraries and examples of how to use the [LLM canister](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=w36hm-eqaaa-aaaal-qr76a-cai) on the IC.

## Libraries

### Rust Library (`ic-llm`)

The `ic-llm` [crate](https://docs.rs/ic-llm/latest/ic_llm/) can be used to deploy Rust agents on the Internet Computer with a few lines of code.

**Example:** Prompting

```rust
use ic_llm::Model;

ic_llm::prompt(Model::Llama3_1_8B, "What's the speed of light?").await;
```

**Example:** Chatting with multiple messages

```rust
use ic_llm::{Model, ChatMessage, Role};

ic_llm::chat(
    Model::Llama3_1_8B,
    vec![
        ChatMessage {
            role: Role::System,
            content: "You are a helpful assistant".to_string(),
        },
        ChatMessage {
            role: Role::User,
            content: "How big is the sun?".to_string(),
        },
    ],
)
.await;
```

### Motoko Library (`mo:llm`)

Similarly, the `mo:llm` package can be used to deploy Motoko agents on the Internet Computer with a few lines of code.

**Example:** Prompting

```motoko
import LLM "mo:llm";

await LLM.prompt(#Llama3_1_8B, prompt)
```

**Example:** Chatting with multiple messages

```motoko
import LLM "mo:llm";

await LLM.chat(#Llama3_1_8B, [
  {
    role = #system_;
    content = "You are a helpful assistant.";
  },
  {
    role = #user;
    content = "How big is the sun?";
  }
])
```

## Example Agents

### Agent to lookup ICP balances

This agent specializes in looking up ICP balances, and can serve as an inspiration for how to build agents on the Internet Computer. Implementations in both Rust and Motoko are provided in the `examples` folder.
