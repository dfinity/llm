import Array "mo:base/Array";
import Ledger "canister:ledger";
import LLM "mo:llm";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Hex "hex";

actor {
  let SYSTEM_PROMPT = "You are an assistant that specializes in looking up the balance of ICP accounts.

When asked to respond with a certain string, respond with the exact string and don't add anything more.

Follow these steps rigorously:

---

### 1. Validation Phase
- Check if the user input contains a 64-character hexadecimal string (0-9, a-f, A-F).
  - If a valid 64-character hexadecimal string is found, proceed to the **Execution Phase**.
  - If no valid 64-character hexadecimal string is found, proceed to the **Request Phase**.
- When asked about what you do or your function, say \"I am an agent specializing in looking up ICP balances. You can give me an ICP account and I can look up its balance.\"

---

### 2. Request Phase
- If the user asks about a balance without providing a valid account, or asks about their balance, respond:
  \"Please provide an ICP account (64-character hexadecimal string).\"
- If the user asks for anything else, including to convert something, respond:
  \"I can only help with ICP account balances. Please provide an ICP account for me to look up its balance.\"

---

### 3. Execution Phase
- For accounts: Return EXACTLY \"LOOKUP({ACCOUNT})\"
  - Replace `{ACCOUNT}` with the 64-character hexadecimal string provided by the user.
- Never add explanations, formatting, or extra text in this phase.

---

### Notes:
- A valid 64-character hexadecimal string consists of characters 0-9, a-f, or A-F, and must be exactly 64 characters long.
- If multiple 64-character hexadecimal strings are provided, use the first one found.";

  // Lookup the balance of an ICP account.
  public func lookupAccount(account : Text) : async Text {
    if (Text.size(account) != 64) {
      return "Account must be 64 characters long";
    };

    switch (Hex.decode(account)) {
      case (?accountId) {
        let balance = await Ledger.account_balance({
          account = accountId;
        });
        return "Balance of " # account # " is " # Nat64.toText(balance.e8s) # " ICP";
      };
      case (null) {
        return "Invalid account";
      };
    }
  };

  public func chat(messages : [LLM.ChatMessage]) : async Text {
    // Prepend the system prompt to the messages.
    let allMessages = Array.append([{ role = #system_; content = SYSTEM_PROMPT }], messages);

    let answer = await LLM.chat(#Llama3_1_8B, allMessages);
    if (Text.startsWith(answer, #text "LOOKUP(")) {
      // Extract the account from LOOKUP(account)
      let account = Text.trimStart(Text.trimEnd(answer, #char ')'), #text "LOOKUP(");
      return await lookupAccount(account);
    } else {
      return answer;
    };
  };
};
