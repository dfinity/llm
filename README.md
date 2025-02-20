# `mo:llm`

A library for making requests to the LLM canister on the Internet Computer.

## Install

```
mops add llm
```

## Usage

### Prompting (single message)

```motoko
import LLM "mo:llm";

actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt)
  };
}
```

### Chatting (multiple messages)

```motoko
import LLM "mo:llm";

actor {
  public func chat(prompt: Text) : async Text {
    await LLM.chat(#Llama3_1_8B, [
      {
        role = #system_;
        content = system_prompt;
      },
      {
        role = #user;
        content = prompt;
      }
    ]);
  };
}
```
