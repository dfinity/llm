# Quickstart AI Agent (Motoko)

A minimal, command-line agent that relays whatever message you give it to the
underlying model without modification. Use it as a starting point for your own
agents on the IC.

The `agent` canister exposes four methods:

- `prompt(model, text) -> text` — send a single prompt, get the model's reply.
- `chat(model, vec ChatMessage) -> text` — send a multi-message conversation.
- `promptWithCycles(...)` / `chatWithCycles(...)` — the same two calls, but
  attaching cycles to pay for a paid model per request (see
  [Paying for models](#paying-for-models)).

Every method takes the model name as its first argument, so you can pick a model
per call. See the [Internet Intelligence Gateway](https://inference.internetcomputer.org/)
for the list of available models — for example the free `llama3.1:8b` or the
paid `z-ai:glm-5.2`.

## Prerequisites

- [mise](https://mise.jdx.dev/) to install Node and pnpm at the versions
  pinned in the repo's `mise.toml` (or install them yourself).
- Run `pnpm install` at the repo root once — that brings in
  [`icp-cli`](https://github.com/dfinity/icp-cli), `ic-wasm`, and
  [`mops`](https://docs.mops.one/quick-start) (the Motoko package manager)
  as project devDependencies, exposed on PATH via mise's `_.path` config.
- [`jq`](https://jqlang.github.io/jq/) — only needed for the deposit flow in
  [Paying for models](#paying-for-models), to read the proxy canister id from
  `icp network status --json`.
- An API key for the Internet Intelligence Gateway — see
  [Getting an API key](#getting-an-api-key). The local `llm` canister uses it
  to serve prompts.

## Quickstart

Save your API key to `.secrets/iig-api-key` (see
[Getting an API key](#getting-an-api-key)). The `.secrets/` directory is
gitignored, so the key stays out of version control:

```bash
mkdir -p .secrets && echo -n "<YOUR_IIG_API_KEY>" > .secrets/iig-api-key
```

`icp.yaml` wires that file's contents into the `llm` canister as its
`IIG_API_KEY` environment variable. Then start the local replica and deploy the
canisters:

```bash
icp network start -d
icp deploy
```

Now call the agent, passing the model as the first argument. A single prompt to
the free `llama3.1:8b` model:

```bash
icp canister call agent prompt '("llama3.1:8b", "Write a haiku about the Internet Computer.")' -e local
```

Or a multi-message conversation via `chat`:

```bash
icp canister call agent chat '("llama3.1:8b", vec {
  variant { system = record { content = "You are a helpful assistant for Internet Computer developers." } };
  variant { user = record { content = "Suggest a fun name for my new canister." } };
})' -e local
```

`llama3.1:8b` is free. To use a paid model like `z-ai:glm-5.2`, see
[Paying for models](#paying-for-models).

## Getting an API key

The local `llm` canister runs in `https` mode: it serves prompts by making
HTTPS outcalls to the Internet Intelligence Gateway, authenticated with an API
key. To get a key:

1. Sign up at https://inference.internetcomputer.org/

Save the key to `.secrets/iig-api-key`:

```bash
mkdir -p .secrets && echo -n "YOUR_API_KEY" > .secrets/iig-api-key
```

`icp.yaml` reads that file and passes it to the `llm` canister as the
`IIG_API_KEY` environment variable (`settings.environment_variables`). icp-cli
uses the file's contents verbatim (trimming surrounding whitespace), so the file
holds just the key.

If you change the key after the first deploy, reinstall the `llm` canister so
the new value takes effect:

```bash
icp deploy llm --mode reinstall
```

## Paying for models

Free models like `llama3.1:8b` cost nothing. Paid models like `z-ai:glm-5.2` are
billed in cycles by the `llm` canister, and there are two ways to pay.

### Attach cycles per request

Call the `*WithCycles` methods. They attach 100B cycles to the request; the model
charges only what it needs and refunds the rest, so the `agent` canister must
hold at least 100B cycles.

```bash
icp canister call agent chatWithCycles '("z-ai:glm-5.2", vec {
  variant { system = record { content = "You are a helpful assistant for Internet Computer developers." } };
  variant { user = record { content = "Suggest a fun name for my new canister." } };
})' -e local
```

### Deposit a balance up front

Alternatively, top up the `agent` canister's balance on the `llm` canister once,
then use the plain `prompt`/`chat` methods — each call draws from that balance
with no cycles attached. Deposit by calling the `llm` canister's `v1_deposit`
with the `agent` canister's principal as the beneficiary and cycles attached:

```bash
AGENT_ID=$(icp canister status agent -e local --id-only)
PROXY=$(icp network status --json | jq -r .proxy_canister_principal)

icp canister call llm v1_deposit "(opt principal \"$AGENT_ID\")" \
  --proxy "$PROXY" --cycles 1000000000000 -e local
```

The CLI can't attach cycles to a call directly — only canisters can — so it
routes them through a proxy canister, which icp-cli runs automatically on the
local network. `v1_deposit` returns the beneficiary's new balance.

Paid models now work through the plain methods, no cycles attached:

```bash
icp canister call agent prompt '("z-ai:glm-5.2", "Write a limerick about a canister on the Internet Computer.")' -e local
```

## How it works locally

`icp-cli` injects `PUBLIC_CANISTER_ID:llm` into `agent` at deploy
time, so the `mo:llm` library picks up the local replica's `llm` canister
principal automatically. On mainnet that env var isn't set and the library
falls back to the well-known principal `w36hm-eqaaa-aaaal-qr76a-cai`. No
code changes needed between environments.

The local `llm` canister deployed here is configured (via its `init_args` in
`icp.yaml`) to run in `https` mode, so it serves each prompt by making an HTTPS
outcall to the Internet Intelligence Gateway, authenticated with the
`IIG_API_KEY` environment variable set from `.secrets/iig-api-key`. So a call
flows `agent` → local `llm` canister → Internet Intelligence Gateway.

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
