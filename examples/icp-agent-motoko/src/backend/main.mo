import LLM "mo:llm";

actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt)
  };

  public func chat(messages: [LLM.ChatMessage]) : async Text {
    await LLM.chat(#Llama3_1_8B, messages)
  }
};
