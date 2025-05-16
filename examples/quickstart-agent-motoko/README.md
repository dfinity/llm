# Quickstart AI Agent (Motoko)

This is a simple agent that simply relays whatever messages the user gives to the underlying models without any modification.
It's meant to serve as a boilerplate project for those who want to get started building agents on the IC.

![Screenshot of the quickstart agent](../../screenshot.png)


## Deployment

### Running Ollama

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

### Deployment

Once Ollama is running and the model has been downloaded, you can start dfx and deploy the canisters.

First, install `pnpm` and run `pnpm install` in the `src/frontend` directory.

Then, in one terminal window, run:

```bash
dfx start --clean
```

Then pull the dependency and deploy the canisters in another window:

```bash
dfx deps pull
dfx deploy
dfx deps deploy  # deploys the llm canister
```

Once the deployment completes, you'll see the URL for the `agent-frontend` that looks like this:

```
http://0.0.0.0:8080/?canisterId={FRONTEND_CANISTER_ID}
```

Due to CORS policies on the browser, you should instead access the agent using the following URL:

```
http://{FRONTEND_CANISTER_ID}.localhost:8080
```
