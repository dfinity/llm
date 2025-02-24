module {
  public type Model = {
    #Llama3_1_8B;
  };

  public type Role = {
    #user;
    #system_;
    #assistant;
  };

  public type ChatMessage = {
    role: Role;
    content: Text;
  };

  type Request = {
    model: Text;
    messages: [ChatMessage];
  };

  let llmCanister = actor("w36hm-eqaaa-aaaal-qr76a-cai"): actor {
    v0_chat: (Request) -> async Text
  };

  func modelString(model: Model) : Text {
    switch(model) {
      case (#Llama3_1_8B) { "llama3.1:8b" };
    }
  };

  public func prompt(model: Model, promptStr: Text) : async Text {
    let request : Request = {
      model = modelString(model);
      messages = [
        {
          role = #user;
          content = promptStr;
        }
      ]
    };

    await llmCanister.v0_chat(request)
  };

  public func chat(model: Model, messages: [ChatMessage]) : async Text {
    let request : Request = {
      model = modelString(model);
      messages = messages;
    };

    await llmCanister.v0_chat(request)
  };
}
