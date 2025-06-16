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

// Conversion functions between our TypeScript types and IDL types (internal use only)
function convertToIdlRole(role: Role): RoleIdl {
  switch (role) {
    case Role.System:
      return { system: null };
    case Role.User:
      return { user: null };
    case Role.Assistant:
      return { assistant: null };
    default:
      return { user: null }; // Default to user if unknown
  }
}

function convertFromIdlRole(roleIdl: RoleIdl): Role {
  if ("system" in roleIdl) {
    return Role.System;
  } else if ("user" in roleIdl) {
    return Role.User;
  } else if ("assistant" in roleIdl) {
    return Role.Assistant;
  } else {
    // Default to User if unknown
    return Role.User;
  }
}

function convertToIdlChatMessage(message: ChatMessage): ChatMessageIdl {
  return {
    content: message.content,
    role: convertToIdlRole(message.role),
  };
}

function convertFromIdlChatMessage(messageIdl: ChatMessageIdl): ChatMessage {
  return {
    content: messageIdl.content,
    role: convertFromIdlRole(messageIdl.role),
  };
}

function convertToIdlChatRequest(request: ChatRequest): ChatRequestIdl {
  return {
    model: request.model,
    messages: request.messages.map(convertToIdlChatMessage),
  };
}

function convertFromIdlChatRequest(requestIdl: ChatRequestIdl): ChatRequest {
  return {
    model: requestIdl.model,
    messages: requestIdl.messages.map(convertFromIdlChatMessage),
  };
}

// Utility function to create a ChatMessage with our Role enum
export function createChatMessage(role: Role, content: string): ChatMessage {
  return {
    role: role,
    content: content,
  };
}

// Model enum equivalent
export enum Model {
  Llama3_1_8B = "llama3.1:8b",
  Qwen3_32B = "qwen3:32b",
  Llama4Scout = "llama4-scout",
}

// Helper function to handle the chat request and response
async function chat_helper(
  model: Model,
  messages: (ChatMessage | ChatMessageIdl)[]
): Promise<string> {
  // Convert our nice TypeScript types to IDL-compatible types
  const chatRequestIdl: ChatRequestIdl = {
    model: model,
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

  const response = await call<[ChatRequestIdl], string>(
    LLM_CANISTER,
    "v0_chat",
    {
      paramIdlTypes: [ChatRequest],
      returnIdlType: IDL.Text,
      args: [chatRequestIdl],
    }
  );

  return response;
}

// Sends a single message to a model
export async function prompt(model: Model, promptStr: string): Promise<string> {
  const message = createChatMessage(Role.User, promptStr);
  return await chat(model, [message]);
}

// Sends a list of messages to a model
export async function chat(
  model: Model,
  messages: ChatMessage[]
): Promise<string> {
  const messages_: (ChatMessage | ChatMessageIdl)[] = messages;
  return await chat_helper(model, messages_);
}
