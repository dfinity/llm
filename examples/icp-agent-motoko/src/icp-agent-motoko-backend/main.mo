import LLM "llm";

actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt)
  };
};
