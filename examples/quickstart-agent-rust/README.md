# ICP Lookup Agent (Rust)

This project is an agent that showcases what it's like to build an agent that specializes in a specific task. In this case, the task is to lookup ICP prices.

It's meant to serve as an example for those who want to get started building agents on the Internet Computer.

[Live Demo](https://twf3b-uqaaa-aaaal-qsiva-cai.icp0.io/)

![Screenshot of the agent](./screenshot.png)



## Quickstart
Prerequisites
- [DFX](https://internetcomputer.org/docs/current/developer-docs/smart-contracts/getting-started/hello10mins) installed
- [Ollama](https://ollama.com/) installed
- [PNPM](https://pnpm.io/) installed

```bash
# start ollama server
ollama serve

# Download the required model (one-time setup):
ollama run llama3.1:8b

# Start the local Internet Computer:
dfx start --clean

# Deploy the canisters:
dfx deploy
dfx deps deploy ledger
```

Finally, access the agent at:
```
http://{FRONTEND_CANISTER_ID}.localhost:8080
```

## Deployment

### LLM Backend Configuration
The LLM canister supports two backend options for processing prompts:

1. **Ollama (Local)**: A free, self-hosted solution that runs on your local machine. Perfect for testing and development without any costs.

2. **Groq API**: A cloud-based solution that can handle larger models that might be too resource-intensive for local machines. Requires an API key (free for testing).

You can select your preferred backend by configuring the `init_arg_file` in `dfx.json`.

> **Note**: The llm canister currently only supports LLama3.1 8B independently of the backend that you choose. Further model support will be added in the near future.


#### Deploy with Ollama
To be able to test the agent locally, you'll need a server for processing the agent's prompts. For that, we'll use `ollama`, which is a tool that can download and serve LLMs.
See the documentation on the [Ollama website](https://ollama.com/) to install it. Once it's installed, run:

```
ollama serve
# Expected to start listening on port 11434
```

The above command will start the Ollama server, so that it can process requests by the agent. Additionally, and in a separate window, run the following command to download the LLM that will be used by the agent:

```
ollama run llama3.1:8b
```

The above command will download an 8B parameter model, which is around 4GiB. Once the command executes and the model is loaded, you can terminate it. You won't need to do this step again.

Now make sure that the `init_arg_file` in your `dfx.json` points to the ollama config `../../init_args/ollama.did`. Alternatively you can also remove the whole `init_arg_file` entry in your `dfx.json` since the ollama backend is the default backend.


#### Deploy with Groq
As an alternative you can use the [Groq API](https://console.groq.com/home). You will need to create an [API key](https://console.groq.com/keys) first (free for testing purposes).

Switch your `init_arg_file` in `dfx.json` to `../../init_args/groq.did` and add your API key inside the `init_args/groq.did` file at `api_key = "{YOUR_API_KEY}"`.


### Deployment

Once your backend is set and initialized, you can start dfx and deploy the canisters.

First, install `pnpm` and run `pnpm install` in the `src/frontend` directory.

Then, in one terminal window, run:

```bash
dfx start --clean
```

Then deploy the canisters in another window:

```bash
dfx deploy
dfx deps deploy ledger # deploys the ledger canister for looking up ICP balances
```

Once the deployment completes, you'll see the URL for the `agent-frontend` that looks like this:

```
http://0.0.0.0:8080/?canisterId={FRONTEND_CANISTER_ID}
```

Due to CORS policies on the browser, you should instead access the agent using the following URL:

```
http://{FRONTEND_CANISTER_ID}.localhost:8080
```
