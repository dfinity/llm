import Array "mo:base/Array";
import Ledger "canister:ledger";
import LLM "mo:llm";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Hex "hex";

actor {
  let SYSTEM_PROMPT = "You are an assistant that exclusively performs ICP balance lookups.\nUse the 'lookup_icp_balance' tool when asked for an account balance and report the balance back to the user.\nIf the user asks about anything else, politely inform them that you can only look up ICP balances and offer to perform a lookup.";

  // Lookup the balance of an ICP account.
  func lookupAccount(account : Text) : async Text {
    if (Text.size(account) != 64) {
      return "Account must be 64 characters long";
    };

    switch (Hex.decode(account)) {
      case (?accountId) {
        let balance = await Ledger.account_balance({
          account = accountId;
        });
        return "Balance of " # account # " is " # Nat64.toText(balance.e8s) # " e8s";
      };
      case (null) {
        return "Invalid account";
      };
    }
  };

  public func chat(messages : [LLM.ChatMessage]) : async Text {
    // Prepend the system prompt to the messages.
    let systemMsg : LLM.ChatMessage = #system_({ content = SYSTEM_PROMPT });
    var allMessages = Array.append([systemMsg], messages);

    let tools = [
        LLM.tool("lookup_icp_balance")
            .withDescription("Lookup the balance of an ICP account.")
            .withParameter(
                LLM.parameter("account", #String)
                    .withDescription("The ICP account (64-character hex string) to look up.")
                    .isRequired()
            )
            .build()
    ];

    let chat = LLM.chat(#Qwen3_32B)
        .withMessages(allMessages)
        .withTools(tools);

    let response = await chat.send();

    let tool_calls = response.message.tool_calls;

    if (tool_calls.size() > 0) {
        // Add assistant message with tool calls
        allMessages := Array.append(allMessages, [#assistant(response.message)]);

        // Process each tool call
        for (tool_call in tool_calls.vals()) {
            let tool_result = await switch (tool_call.function.name) {
                case ("lookup_icp_balance") {
                    // Arguments are provided as an array of ToolCallArgument
                    let arguments = tool_call.function.arguments;
                    // Find the account parameter
                    var account = "";
                    for (arg in arguments.vals()) {
                        if (arg.name == "account") {
                            account := arg.value;
                        };
                    };
                    if (account != "") {
                        lookupAccount(account)
                    } else {
                        async "Missing account parameter for lookup_icp_balance"
                    }
                };
                case (_) {
                    async "Unknown tool: " # tool_call.function.name
                };
            };

            // Add tool result to conversation
            allMessages := Array.append(allMessages, [
                #tool({
                    content = tool_result;
                    tool_call_id = tool_call.id;
                })
            ]);
        };

        // Get final response from LLM with tool results
        let final_response = await LLM.chat(#Qwen3_32B)
            .withMessages(allMessages)
            .send();

        switch (final_response.message.content) {
            case (?text) text;
            case null "";
        }
    } else {
        // No tool calls needed, return direct response
        switch (response.message.content) {
            case (?text) text;
            case null "";
        }
    }
  };
};
