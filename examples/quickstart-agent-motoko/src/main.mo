import LLM "mo:llm";

persistent actor {
  // Send to a free model, or to a paid model funded by a prior deposit to this
  // canister's balance (see the README's "Paying for models"). No cycles are
  // attached to the call.
  public func prompt(model : Text, prompt : Text) : async Text {
    await LLM.prompt(model, prompt);
  };

  public func chat(model : Text, messages : [LLM.ChatMessage]) : async Text {
    reply(await LLM.chat(model).withMessages(messages).send());
  };

  // Pay for a paid model per request by attaching 100B cycles to the call. The
  // model charges only what it needs and refunds the rest, so this canister must
  // hold at least 100B cycles or the call traps.
  public func promptWithCycles(model : Text, prompt : Text) : async Text {
    reply(await LLM.chat(model).withMessages([#user { content = prompt }]).withCycles().send());
  };

  public func chatWithCycles(model : Text, messages : [LLM.ChatMessage]) : async Text {
    reply(await LLM.chat(model).withMessages(messages).withCycles().send());
  };

  func reply(response : LLM.Response) : Text {
    switch (response.message.content) {
      case (?text) text;
      case null "";
    };
  };
};
