# `mo:llm`

A library for making requests to the LLM canister on the Internet Computer.

## Supported Models

Models are identified by their string name (passed to `LLM.prompt` and
`LLM.chat`). See the [Intelligence Gateway Homepage](https://inference.internetcomputer.org/) for the authoritative, up-to-date list.

## Examples

The simplest interaction is a single prompt, which returns the reply text
directly:

```motoko
import LLM "mo:llm";

let answer = await LLM.prompt("llama3.1:8b", "Write a haiku about the Internet Computer.");
```

For a multi-turn conversation, build a chat from a list of messages:

```motoko
import LLM "mo:llm";

let response = await LLM.chat("llama3.1:8b").withMessages([
  #system_ { content = "You are a helpful assistant for Internet Computer developers." },
  #user { content = "Suggest a fun name for my new canister." },
]).send();

let reply = switch (response.message.content) {
  case (?text) text;
  case null "";
};
```

To pay per request, attach cycles with `.withCycles()` (see
[Paying for Models](#paying-for-models)):

```motoko
let response = await LLM.chat("gemma3:27b").withMessages([
  #system_ { content = "You are a helpful assistant for Internet Computer developers." },
  #user { content = "Suggest a fun name for my new canister." },
]).withCycles().send();
```

## Paying for Models

Paying for inference can be done in two ways.

1. **Deposit cycles up front.** Add a cycles balance at
   [inference.internetcomputer.org](https://inference.internetcomputer.org). The
   LLM canister draws from that balance, so requests need no attached cycles —
   just call without `.withCycles()`. This works on **both mainnet and cloud
   engines**.

2. **Attach cycles per request.** Call `.withCycles()` on the builder and
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

See the [quickstart example](../examples/quickstart-agent-motoko) for a complete
project — `icp.yaml`, deploying locally, and calling the agent.

## Install

```
mops add llm
```
