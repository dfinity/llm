# Quickstart AI Agent (Motoko)

A minimal, command-line agent that relays whatever message you give it to the
underlying model without modification. Use it as a starting point for your own
agents on the IC.

The `agent` canister exposes two methods:

- `prompt(text) -> text` — send a single prompt, get the model's reply.
- `chat(vec ChatMessage) -> text` — send a multi-message conversation.

## Prerequisites

- [mise](https://mise.jdx.dev/) to install Node and pnpm at the versions
  pinned in the repo's `mise.toml` (or install them yourself).
- Run `pnpm install` at the repo root once — that brings in
  [`icp-cli`](https://github.com/dfinity/icp-cli), `ic-wasm`, and
  [`mops`](https://docs.mops.one/quick-start) (the Motoko package manager
  the `@dfinity/motoko` recipe shells out to) as project devDependencies,
  exposed on PATH via mise's `_.path` config.
- An API key for the Internet Intelligence Gateway — see
  [Getting an API key](#getting-an-api-key). The local `llm` canister uses it
  to serve prompts.

## Quickstart

Add your API key to the `llm` canister's `init_args` in `icp.yaml`
(see [Getting an API key](#getting-an-api-key)):

```yaml
init_args: '(opt variant { https = record { api_key = "<YOUR_IIG_API_KEY>" } })'
```

Then start the local replica and deploy the canisters:

```bash
icp network start -d
icp deploy
```

Now call the agent. A single prompt:

```bash
icp canister call agent prompt '("Write a haiku about the Internet Computer.")' -e local
```

Or a multi-message conversation via `chat`:

```bash
icp canister call agent chat '(vec {
  variant { system = record { content = "You are a helpful assistant for Internet Computer developers." } };
  variant { user = record { content = "Suggest a fun name for my new canister." } };
})' -e local
```

## Getting an API key

The local `llm` canister runs in `https` mode: it serves prompts by making
HTTPS outcalls to the Internet Intelligence Gateway, authenticated with an API
key. To get a key:

1. Sign up at https://inference.internetcomputer.org/beta.

Put the key in the `llm` canister's `init_args` in `icp.yaml`:

```yaml
init_args: '(opt variant { https = record { api_key = "YOUR_API_KEY" } })'
```

If you change the key after the first deploy, reinstall the `llm` canister so
the new init args take effect:

```bash
icp deploy llm --mode reinstall
```

## How it works locally

`icp-cli` injects `PUBLIC_CANISTER_ID:llm` into `agent` at deploy
time, so the `mo:llm` library picks up the local replica's `llm` canister
principal automatically. On mainnet that env var isn't set and the library
falls back to the well-known principal `w36hm-eqaaa-aaaal-qr76a-cai`. No
code changes needed between environments.

## Deploying to mainnet

Use the `ic` environment:

```bash
icp deploy -e ic
```

The first deploy creates a fresh `agent` canister on mainnet; its
principal is written to `.icp/data/mappings/ic.ids.json`, which should be
committed so future deploys reuse it. The `llm` canister is excluded from the
`ic` environment in `icp.yaml` — mainnet already runs the canonical LLM
canister at `w36hm-…` and the SDK addresses it directly.
