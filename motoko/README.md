# `mo:llm`

A library for making requests to the LLM canister on the Internet Computer.

## Supported Models

Models are identified by their string name (passed to `LLM.prompt` and
`LLM.chat`). See the [Intelligence Gateway Homepage](https://inference.internetcomputer.org/) for the authoritative, up-to-date list.

## Paying for Models

For paid models, `send()` attaches 100B cycles to the request — the model
charges only what it needs and refunds the rest — **so the calling canister must
hold at least 100B cycles or the call traps**. Free models are called with no
cycles attached, so the caller doesn't need to hold any.

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

See the [quickstart example](../examples/quickstart-agent-motoko) for a complete
project — `icp.yaml`, deploying locally, and calling the agent.

## Install

```
mops add llm
```

## Usage

### Prompting (single message)

The simplest way to interact with a model is by sending a single prompt:

```motoko
import LLM "mo:llm";

let answer = await LLM.prompt("llama3.1:8b", "Write a haiku about the Internet Computer.");
```

### Chatting (multiple messages)

For more complex interactions, send multiple messages in a conversation:

```motoko
import LLM "mo:llm";

let response = await LLM.chat("llama3.1:8b").withMessages([
  #system_ { content = "You are a helpful assistant for Internet Computer developers." },
  #user { content = "Suggest a fun name for my new canister." },
]).send();
```
