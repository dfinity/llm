import { IDL, update } from "azle";
import * as llm from "@dfinity/llm";

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

export const ChatMessage_IDL = IDL.Variant({
  user: IDL.Record({
    content: IDL.Text,
  }),
  assistant: AssistantMessage_IDL,
  system: IDL.Record({
    content: IDL.Text,
  }),
});

export default class {
  @update([IDL.Text], IDL.Text)
  async prompt(prompt: string): Promise<string> {
    return await llm.prompt(llm.Model.Llama3_1_8B, prompt);
  }

  @update([IDL.Vec(ChatMessage_IDL)], IDL.Text)
  async chat(messages: llm.ChatMessage[]): Promise<string> {
    return (
      (await llm.chat(llm.Model.Llama3_1_8B).withMessages(messages).send())
        .message.content?.[0] || ""
    );
  }
}
