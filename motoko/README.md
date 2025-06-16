# `mo:llm`

A library for making requests to the LLM canister on the Internet Computer.

## Supported Models

The following LLM models are available:

- `#Llama3_1_8B` - Llama 3.1 8B model
- `#Qwen3_32B` - Qwen 3 32B model
- `#Llama4Scout` - Llama 4 Scout model

## Install

```
mops add llm
```

## Usage

### Prompting (single message)

The simplest way to interact with a model is by sending a single prompt:

```motoko
import LLM "mo:llm";

actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt);
  };
}
```

### Chatting (multiple messages)

For more complex interactions, you can send multiple messages in a conversation:

```motoko
import LLM "mo:llm";

actor {
  public func example() {
    let response = await LLM.chat(#Llama3_1_8B).withMessages([
      #system_ {
        content = "You are a helpful assistant.";
      },
      #user {
        content = "How big is the sun?";
      },
    ]).send();
  };
}
```

### Advanced Usage with Tools

#### Defining and Using a Tool

You can define tools that the LLM can use to perform actions:

```motoko
import LLM "mo:llm";

actor {
  public func example() {
    let response = await LLM.chat(#Llama3_1_8B)
      .withMessages([
        #system_ {
          content = "You are a helpful assistant."
        },
        #user {
          content = "What's the weather in San Francisco?"
        },
      ])
      .withTools([LLM.tool("get_weather")
        .withDescription("Get current weather for a location")
        .withParameter(
          LLM.parameter("location", #String)
            .withDescription("The location to get weather for")
            .isRequired()
        )
        .build()
      ])
      .send();
  };
}
```
