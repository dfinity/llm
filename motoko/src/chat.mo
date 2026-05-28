import Principal "mo:base/Principal";
import Runtime "mo:core/Runtime";
import Tool "./tool";

module {
    /// The mainnet principal of the LLM canister.
    let MAINNET_LLM_CANISTER : Text = "w36hm-eqaaa-aaaal-qr76a-cai";

    /// Name of the canister env var icp-cli injects with the local llm canister id.
    let LLM_CANISTER_ENV : Text = "PUBLIC_CANISTER_ID:llm";

    type LlmCanister = actor {
        v1_chat : (Request) -> async Response;
    };

    /// Resolves the LLM canister: prefers `PUBLIC_CANISTER_ID:llm` (auto-injected
    /// by `icp deploy`) and otherwise falls back to the mainnet canister.
    private func defaultLlmCanister<system>() : LlmCanister {
        let id = switch (Runtime.envVar<system>(LLM_CANISTER_ENV)) {
            case (?id) id;
            case null MAINNET_LLM_CANISTER;
        };
        actor (id) : LlmCanister
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
        private var _canister : ?Principal = null;

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

        /// Overrides the LLM canister to call.
        ///
        /// By default the SDK addresses the mainnet LLM canister
        /// (`w36hm-eqaaa-aaaal-qr76a-cai`), unless `icp deploy` has auto-injected
        /// `PUBLIC_CANISTER_ID:llm` on this canister. Set this only when neither
        /// default is what you want.
        public func withCanister(canister : Principal) : ChatBuilder {
            _canister := ?canister;
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
        public func send<system>() : async Response {
            let request = build();
            let llm : LlmCanister = switch (_canister) {
                case (?c) actor (Principal.toText(c));
                case null defaultLlmCanister<system>();
            };
            await llm.v1_chat(request)
        };
    };
};
