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

### TypeScript Library (`@dfinity/llm`)

The `@dfinity/llm` npm package can be used to deploy TypeScript agents on the Internet Computer with a few lines of code.

**Example:** Prompting

```typescript
import * as llm from "@dfinity/llm";

await llm.prompt(llm.Model.Llama3_1_8B, "What's the speed of light?");
```

**Example:** Chatting with multiple messages

```typescript
import * as llm from "@dfinity/llm";

await llm.chat(llm.Model.Llama3_1_8B, [
  {
    content: "You are a helpful assistant.",
    role: llm.Role.System,
  },
  {
    content: "How big is the sun?",
    role: llm.Role.User,
  }
]);
```

## Example Agents

### Quickstart Agent

This is a simple agent that simply relays whatever messages the user gives to the underlying models without any modification.
It's meant to serve as a boilerplate project for those who want to get started building agents on the IC.

A Rust and a Motoko implementation are provided in the `examples` folder.

Additionally, a live deployment of this agent can be accessed [here](https://vgjrt-uyaaa-aaaal-qsiaq-cai.icp0.io/).

![Screenshot of the quickstart agent](screenshot.png)

### ICP Lookup Agent

Showcases what it's like to build an agent that specializes in a specific task. In this case, the task is to lookup ICP prices.

A Rust and a Motoko implementation are provided in the `examples` folder.

Additionally, a live deployment of this agent can be accessed [here](https://twf3b-uqaaa-aaaal-qsiva-cai.icp0.io/).

![Screenshot of the ICP lookup agent](./examples/icp-lookup-agent-rust/screenshot.png)
