import { IDL, call } from "azle";

// The principal of the LLM canister
const LLM_CANISTER = "w36hm-eqaaa-aaaal-qr76a-cai";

// Model enum
export enum Model {
  Llama3_1_8B = "llama3.1:8b",
}

// ==================== Tool Types ====================

export enum ParameterType {
  String = "string",
  Boolean = "boolean",
  Number = "number",
}

export interface Property {
  type: string;
  name: string;
  description?: string;
  enum?: string[];
}

export interface Parameters {
  type: string;
  properties?: Property[];
  required?: string[];
}

export interface Function {
  name: string;
  description?: string;
  parameters?: Parameters;
}

export interface Tool {
  function: Function;
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
  | { user: { content: string } }
  | { system: { content: string } }  
  | { assistant: AssistantMessage }
  | { tool: { content: string; tool_call_id: string } };

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

const ChatMessage_IDL = IDL.Variant({
  user: IDL.Record({ content: IDL.Text }),
  system: IDL.Record({ content: IDL.Text }),
  assistant: AssistantMessage_IDL,
  tool: IDL.Record({
    content: IDL.Text,
    tool_call_id: IDL.Text,
  }),
});

const Property_IDL = IDL.Record({
  type: IDL.Text,
  name: IDL.Text,
  description: IDL.Opt(IDL.Text),
  enum: IDL.Opt(IDL.Vec(IDL.Text)),
});

const Parameters_IDL = IDL.Record({
  type: IDL.Text,
  properties: IDL.Opt(IDL.Vec(Property_IDL)),
  required: IDL.Opt(IDL.Vec(IDL.Text)),
});

const Function_IDL = IDL.Record({
  name: IDL.Text,
  description: IDL.Opt(IDL.Text),
  parameters: IDL.Opt(Parameters_IDL),
});

const Tool_IDL = IDL.Record({
  function: Function_IDL,
});

const Request_IDL = IDL.Record({
  model: IDL.Text,
  messages: IDL.Vec(ChatMessage_IDL),
  tools: IDL.Opt(IDL.Vec(Tool_IDL)),
});

const Response_IDL = IDL.Record({
  message: AssistantMessage_IDL,
});

// ==================== Builder Classes ====================

export class ParameterBuilder {
  private name: string;
  private type: ParameterType;
  private description?: string;
  private required: boolean = false;
  private enumValues?: string[];

  constructor(name: string, type: ParameterType) {
    this.name = name;
    this.type = type;
  }

  withDescription(description: string): ParameterBuilder {
    this.description = description;
    return this;
  }

  isRequired(): ParameterBuilder {
    this.required = true;
    return this;
  }

  withEnumValues(values: string[]): ParameterBuilder {
    this.enumValues = values;
    return this;
  }

  toProperty(): Property {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      enum: this.enumValues,
    };
  }

  isRequiredProperty(): boolean {
    return this.required;
  }

  getName(): string {
    return this.name;
  }
}

export class ToolBuilder {
  private functionDef: Function;
  private parameters: ParameterBuilder[] = [];

  constructor(name: string) {
    this.functionDef = {
      name,
    };
  }

  withDescription(description: string): ToolBuilder {
    this.functionDef.description = description;
    return this;
  }

  withParameter(parameter: ParameterBuilder): ToolBuilder {
    this.parameters.push(parameter);
    return this;
  }

  build(): Tool {
    if (this.parameters.length > 0) {
      const properties = this.parameters.map(p => p.toProperty());
      const required = this.parameters
        .filter(p => p.isRequiredProperty())
        .map(p => p.getName());

      this.functionDef.parameters = {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return {
      function: this.functionDef,
    };
  }
}

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
    .withMessages([{ user: { content: promptStr } }])
    .send()
    .then(response => response.message.content || "");
}

export function chat(model: Model): ChatBuilder {
  return new ChatBuilder(model);
}

export function tool(name: string): ToolBuilder {
  return new ToolBuilder(name);
}

export function parameter(name: string, type: ParameterType): ParameterBuilder {
  return new ParameterBuilder(name, type);
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

// ==================== Message Creation Helpers ====================

export function createUserMessage(content: string): ChatMessage {
  return { user: { content } };
}

export function createSystemMessage(content: string): ChatMessage {
  return { system: { content } };
}

export function createAssistantMessage(content?: string, toolCalls: ToolCall[] = []): ChatMessage {
  return { 
    assistant: { 
      content, 
      tool_calls: toolCalls 
    } 
  };
}

export function createToolMessage(content: string, toolCallId: string): ChatMessage {
  return { 
    tool: { 
      content, 
      tool_call_id: toolCallId 
    } 
  };
}
