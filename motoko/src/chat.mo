import Tool "./tool";

module {
    private let llmCanister = actor ("w36hm-eqaaa-aaaal-qr76a-cai") : actor {
        v1_chat : (Request) -> async Response;
    };

    /// A message in a chat.
    public type ChatMessage = {
        #user : { content : Text };
        #system_ : { content : Text };
        #assistant : AssistantMessage;
        #tool : { content : Text; tool_call_id : Text };
    };

    public type Response = {
        message : AssistantMessage;
    };

    public type AssistantMessage = {
        content : ?Text;
        tool_calls : [Tool.ToolCall];
    }; 
 
    /// Request type sent to the LLM canister
    public type Request = {
        model : Text;
        messages : [ChatMessage];
        tools : ?[Tool.Tool];
    };

    /// Supported LLM models
    public type Model = {
        #Llama3_1_8B;
        #Qwen3_32B;
        #Llama4Scout;
    };

    public func modelToText(model : Model) : Text {
        switch (model) {
            case (#Llama3_1_8B) { "llama3.1:8b" };
            case (#Qwen3_32B) { "qwen3:32b" };
            case (#Llama4Scout) { "llama4-scout" };
        };
    };

    /// Builder for creating and sending chat requests to the LLM canister.
    public class ChatBuilder(model : Model) = self {
        private var _model : Model = model;
        private var _messages : [ChatMessage] = [];
        private var _tools : [Tool.Tool] = [];

        /// Sets the messages for the chat.
        public func withMessages(messages : [ChatMessage]) : ChatBuilder {
            _messages := messages;
            self;
        };

        /// Sets the tools for the chat.
        public func withTools(tools : [Tool.Tool]) : ChatBuilder {
            _tools := tools;
            self;
        };

        /// Builds the chat request without sending it.
        public func build() : Request {
            let tools_option = if (_tools.size() == 0) {
                null;
            } else {
                ?_tools;
            };

            {
                model = modelToText(_model);
                messages = _messages;
                tools = tools_option;
            }
        };

        /// Sends the chat request to the LLM canister.
        public func send() : async Response {
            let request = build();
            await llmCanister.v1_chat(request)
        };
    };
};
