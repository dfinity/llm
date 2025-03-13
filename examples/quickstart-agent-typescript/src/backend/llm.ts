import { IDL, call } from "azle";

// The principal of the LLM canister
const LLM_CANISTER = "w36hm-eqaaa-aaaal-qr76a-cai";

// Define a TypeScript enum for Role (more ergonomic to use)
export enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
}

// Define the IDL type for role (needed for serialization)
export type RoleIdl = { user: null } | { assistant: null } | { system: null };

export const Role_IDL = IDL.Variant({
  user: IDL.Null,
  assistant: IDL.Null,
  system: IDL.Null,
});

// Define our preferred TypeScript interface using the enum
export interface ChatMessage {
  content: string;
  role: Role;
}

// Define the IDL type constructor with the same name
export const ChatMessage = IDL.Record({
  content: IDL.Text,
  role: Role_IDL,
});

// Define the IDL-compatible interface
interface ChatMessageIdl {
  content: string;
  role: RoleIdl;
}

// Define our preferred TypeScript interface for requests
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
}

// Define the IDL type constructor with the same name
export const ChatRequest = IDL.Record({
  model: IDL.Text,
  messages: IDL.Vec(ChatMessage),
});

// Define the IDL-compatible interface
interface ChatRequestIdl {
  model: string;
  messages: Array<ChatMessageIdl>;
}

/**
 * Model enum for available LLM models
 */
export enum Model {
  Llama3_1_8B = "llama3.1:8b",
}

/**
 * Converts a ChatMessage to its IDL representation
 */
function convertToIdlChatMessage(message: ChatMessage): ChatMessageIdl {
  // Convert role directly here
  let idlRole: RoleIdl;
  switch (message.role) {
    case Role.System:
      idlRole = { system: null };
      break;
    case Role.Assistant:
      idlRole = { assistant: null };
      break;
    case Role.User:
    default:
      idlRole = { user: null };
      break;
  }
  
  return {
    content: message.content,
    role: idlRole,
  };
}

/**
 * Helper function to handle the chat request and response
 */
async function chatHelper(
  model: Model,
  messages: (ChatMessage | ChatMessageIdl)[]
): Promise<string> {
  // Convert chat messages to IDL types if needed.
  const chatRequestIdl: ChatRequestIdl = {
    model,
    messages: messages.map((message) => {
      // Check if the message is already in IDL format by checking if the role property is an object
      if (message.role && typeof message.role === "object") {
        return message as ChatMessageIdl;
      } else {
        // Otherwise, convert from ChatMessage to ChatMessageIdl
        return convertToIdlChatMessage(message as ChatMessage);
      }
    }),
  };

  return await call<[ChatRequestIdl], string>(
    LLM_CANISTER,
    "v0_chat",
    {
      paramIdlTypes: [ChatRequest],
      returnIdlType: IDL.Text,
      args: [chatRequestIdl],
    }
  );
}

/**
 * Sends a single message to a model
 */
export async function prompt(model: Model, promptStr: string): Promise<string> {
  return await chat(model, [{ role: Role.User, content: promptStr }]);
}

/**
 * Sends a list of messages to a model
 */
export async function chat(
  model: Model,
  messages: ChatMessage[]
): Promise<string> {
  const messages_: (ChatMessage | ChatMessageIdl)[] = messages;
  return await chatHelper(model, messages_);
}
