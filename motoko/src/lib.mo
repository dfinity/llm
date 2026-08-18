import Chat "./chat";
import Tool "./tool";
import { ChatBuilder } "./chat";

module {
  public type ChatMessage = Chat.ChatMessage;
  public type ToolCallArgument = Tool.ToolCallArgument;
  public type ToolCall = Tool.ToolCall;
  public type AssistantMessage = Chat.AssistantMessage;
  public type Response = Chat.Response;
  public type Request = Chat.Request;
  public type ChatBuilder = Chat.ChatBuilder.ChatBuilder;
  public type ToolBuilder = Tool.ToolBuilder.ToolBuilder;
  public type ParameterBuilder = Tool.ParameterBuilder.ParameterBuilder;

  public func prompt(model : Text, promptStr : Text) : async Text {
    let builder = ChatBuilder.new(model).withMessages([
      #user({
        content = promptStr;
      })
    ]);
    let response = await ChatBuilder.send(builder);

    switch (response.message.content) {
      case (?text) text;
      case null "";
    };
  };

  public func chat(model : Text) : ChatBuilder {
    Chat.ChatBuilder.new(model);
  };

  public func tool(name : Text) : ToolBuilder {
    Tool.ToolBuilder.new(name);
  };

  public func parameter(name : Text, type_ : Tool.ParameterType) : ParameterBuilder {
    Tool.ParameterBuilder.new(name, type_);
  };
};
