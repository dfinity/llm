import Chat "./chat";
import Tool "./tool";

module {
  public type ChatMessage = Chat.ChatMessage;

  public func prompt(model : Chat.Model, promptStr : Text) : async Text {
    let response = await Chat.ChatBuilder(model).withMessages([
      #user({
        content = promptStr;
      })
    ]).send();

    switch (response.message.content) {
      case (?text) text;
      case null "";
    };
  };

  public func chat(model : Chat.Model) : Chat.ChatBuilder {
    Chat.ChatBuilder(model);
  };

  public func tool(name: Text) : Tool.ToolBuilder {
    Tool.ToolBuilder(name)
  };

  public func parameter(name: Text, type_: Tool.ParameterType) : Tool.ParameterBuilder {
    Tool.ParameterBuilder(name, type_)
  };
};
