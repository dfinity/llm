import { IDL, call } from "azle";

// The principal of the LLM canister
const LLM_CANISTER = "w36hm-eqaaa-aaaal-qr76a-cai";

// Model enum
export enum Model {
  Llama3_1_8B = "llama3.1:8b",
}

// ==================== Tool Types ====================

export interface Parameter {
  name: string;
  type: "string" | "boolean" | "number";
  description?: string;
  required?: boolean;
  enum?: string[];
}

export interface Tool {
  name: string;
  description?: string;
  parameters?: Parameter[];
}

export interface ToolCallArgument {
  name: string;
  value: string;
}

export interface FunctionCall {
  name: string;
  arguments: ToolCallArgument[];
}

export interface ToolCall {
  id: string;
  function: FunctionCall;
}

export interface AssistantMessage {
  content?: string;
  tool_calls: ToolCall[];
}

export interface Response {
  message: AssistantMessage;
}

// ==================== Chat Message Types ====================

export type ChatMessage = 
  | { role: 'user'; content: string }
  | { role: 'system'; content: string }  
  | { role: 'assistant'; content?: string; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

// ==================== IDL Definitions ====================

const ToolCallArgument_IDL = IDL.Record({
  name: IDL.Text,
  value: IDL.Text,
});

const FunctionCall_IDL = IDL.Record({
  name: IDL.Text,
  arguments: IDL.Vec(ToolCallArgument_IDL),
});

const ToolCall_IDL = IDL.Record({
  id: IDL.Text,
  function: FunctionCall_IDL,
});

const AssistantMessage_IDL = IDL.Record({
  content: IDL.Opt(IDL.Text),
  tool_calls: IDL.Vec(ToolCall_IDL),
});

const ChatMessage_IDL = IDL.Record({
  role: IDL.Text,
  content: IDL.Opt(IDL.Text),
  tool_calls: IDL.Opt(IDL.Vec(ToolCall_IDL)),
  tool_call_id: IDL.Opt(IDL.Text),
});

const Parameter_IDL = IDL.Record({
  name: IDL.Text,
  type: IDL.Text,
  description: IDL.Opt(IDL.Text),
  required: IDL.Opt(IDL.Bool),
  enum: IDL.Opt(IDL.Vec(IDL.Text)),
});

const Tool_IDL = IDL.Record({
  name: IDL.Text,
  description: IDL.Opt(IDL.Text),
  parameters: IDL.Opt(IDL.Vec(Parameter_IDL)),
});

const Request_IDL = IDL.Record({
  model: IDL.Text,
  messages: IDL.Vec(ChatMessage_IDL),
  tools: IDL.Opt(IDL.Vec(Tool_IDL)),
});

const Response_IDL = IDL.Record({
  message: AssistantMessage_IDL,
});

// ==================== Chat Builder Class ====================

export class ChatBuilder {
  private model: Model;
  private messages: ChatMessage[] = [];
  private tools: Tool[] = [];

  constructor(model: Model) {
    this.model = model;
  }

  withMessages(messages: ChatMessage[]): ChatBuilder {
    this.messages = messages;
    return this;
  }

  withTools(tools: Tool[]): ChatBuilder {
    this.tools = tools;
    return this;
  }

  async send(): Promise<Response> {
    const request = {
      model: this.model,
      messages: this.messages,
      tools: this.tools.length > 0 ? this.tools : undefined,
    };

    const response = await call<[typeof request], Response>(
      LLM_CANISTER,
      "v1_chat",
      {
        paramIdlTypes: [Request_IDL],
        returnIdlType: Response_IDL,
        args: [request],
      }
    );

    return response;
  }
}

// ==================== Convenience Functions ====================

export function prompt(model: Model, promptStr: string): Promise<string> {
  return chat(model)
    .withMessages([{ role: 'user', content: promptStr }])
    .send()
    .then(response => response.message.content || "");
}

export function chat(model: Model): ChatBuilder {
  return new ChatBuilder(model);
}

// ==================== Helper Functions for Tool Calls ====================

export class FunctionCallHelper {
  private functionCall: FunctionCall;

  constructor(functionCall: FunctionCall) {
    this.functionCall = functionCall;
  }

  get(argumentName: string): string | undefined {
    const arg = this.functionCall.arguments.find(arg => arg.name === argumentName);
    return arg?.value;
  }
}
