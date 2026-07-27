import Tool "./tool";

module {
    private let llmCanister = actor ("w36hm-eqaaa-aaaal-qr76a-cai") : actor {
        v1_chat : (Request) -> async Response;
    };

    /// Cycles attached to every `v1_chat` call.
    ///
    /// Paid models require a minimum of 100B cycles to accept a request. Free
    /// models charge nothing: they accept no cycles and the full amount is
    /// refunded. Paid models accept only what's needed to cover the request and
    /// refund the remainder, so attaching this amount unconditionally is safe.
    ///
    /// Note: the calling canister must hold at least this many cycles when
    /// `send()` runs, otherwise the call traps.
    let CYCLES_PER_CHAT : Nat = 100_000_000_000;

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

    /// Builder for creating and sending chat requests to the LLM canister.
    ///
    /// `model` is the canister's model identifier, e.g. `"llama3.1:8b"` (free)
    /// or `"gemma3:27b"` (paid). See the README for the current list.
    public class ChatBuilder(model : Text) = self {
        private var _model : Text = model;
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
                model = _model;
                messages = _messages;
                tools = tools_option;
            }
        };

        /// Sends the chat request to the LLM canister.
        ///
        /// Attaches `CYCLES_PER_CHAT` cycles to pay for paid models. Free models
        /// refund the full amount. The calling canister must hold at least that
        /// many cycles or this call traps.
        public func send() : async Response {
            let request = build();
            await (with cycles = CYCLES_PER_CHAT) llmCanister.v1_chat(request)
        };
    };
};
