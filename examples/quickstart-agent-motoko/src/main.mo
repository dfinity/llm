import LLM "mo:llm";

persistent actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt("llama3.1:8b", prompt);
  };

  public func chat(messages : [LLM.ChatMessage]) : async Text {
    let response = await LLM.chat("llama3.1:8b").withMessages(messages).send();

    switch (response.message.content) {
      case (?text) text;
      case null "";
    };
  };
};
