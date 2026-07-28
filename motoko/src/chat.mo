import Prim "mo:⛔";
import Tool "./tool";

module {
    /// The mainnet principal of the LLM canister.
    let MAINNET_LLM_CANISTER = "w36hm-eqaaa-aaaal-qr76a-cai";

    type LlmCanister = actor {
        v1_chat : (Request) -> async Response;
    };

    /// Resolves the LLM canister to call.
    ///
    /// Prefers the `PUBLIC_CANISTER_ID:llm` environment variable (auto-injected
    /// by `icp deploy` so the library targets the local `llm` canister during
    /// development) and otherwise falls back to the mainnet canister.
    func llmCanister<system>() : LlmCanister {
        let id = switch (Prim.envVar<system>("PUBLIC_CANISTER_ID:llm")) {
            case (?principal) principal;
            case null MAINNET_LLM_CANISTER;
        };
        actor (id) : LlmCanister;
    };

    /// Cycles attached to a `v1_chat` call for a paid model.
    ///
    /// Paid models require a minimum of 100B cycles to accept a request; they
    /// charge only what the request costs and refund the remainder. Free models
    /// accept no cycles, so we attach none — see `FREE_MODELS`.
    let CYCLES_PER_CHAT : Nat = 100_000_000_000;

    /// Models that are free to call. Requests to these attach no cycles, so the
    /// calling canister doesn't need to hold any. Every other model is treated
    /// as paid and gets `CYCLES_PER_CHAT` attached.
    let FREE_MODELS = ["llama3.1:8b", "qwen3:32b"];

    func isFreeModel(model : Text) : Bool {
        for (freeModel in FREE_MODELS.vals()) {
            if (freeModel == model) return true;
        };
        false;
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
        /// Paid models get `CYCLES_PER_CHAT` cycles attached (the calling
        /// canister must hold at least that many or this call traps); free
        /// models get none.
        public func send() : async Response {
            let request = build();
            let cyclesToAttach = if (isFreeModel(_model)) 0 else CYCLES_PER_CHAT;
            await (with cycles = cyclesToAttach) llmCanister<system>().v1_chat(request)
        };
    };
};
