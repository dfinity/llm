module {
  public type Model = {
    #Llama3_1_8B;
  };

  type Role = {
    #user;
    #system2;
  };

  type ChatMessage = {
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

  public func prompt(model: Model, promptStr: Text) : async Text {
    let request : Request = {
      model = "llama3.1:8b";
      messages = [
        {
          role = #user;
          content = promptStr;
        }
      ]
    };

    await llmCanister.v0_chat(request)
  }
}
