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

  /// Cycles attached to a `v1_chat` call when the caller opts in via
  /// `ChatBuilder.withCycles`.
  ///
  /// Paid models require a minimum of 100B cycles to accept a request; they
  /// charge only what the request costs and refund the remainder. Free models
  /// accept no cycles. Whether to attach is the caller's decision — this
  /// library no longer guesses from the model name.
  let CYCLES_PER_CHAT : Nat = 100_000_000_000;

  /// Deadline (in seconds) for a `v1_chat` call.
  let CHAT_TIMEOUT_SECONDS : Nat32 = 300;

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
  public class ChatBuilder(model : Text) = self {
    private var _model : Text = model;
    private var _messages : [ChatMessage] = [];
    private var _tools : [Tool.Tool] = [];
    private var _attachCycles : Bool = false;

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

    /// Attaches cycles to the request (100B cycles).
    ///
    /// Call this when you want to pay for models using attached cycles.
    /// By default, no cycles are attached and your request is charged
    /// against the canister's balance on IIG.
    public func withCycles() : ChatBuilder {
      _attachCycles := true;
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
      };
    };

    /// Sends the chat request to the LLM canister.
    public func send() : async Response {
      let request = build();
      let cyclesToAttach = if (_attachCycles) CYCLES_PER_CHAT else 0;
      await (with cycles = cyclesToAttach; timeout = CHAT_TIMEOUT_SECONDS) llmCanister<system>().v1_chat(request);
    };
  };
};
