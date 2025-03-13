import { IDL, update } from 'azle';
import * as llm from './llm';
import * as llm2 from "@dfinity/llm";

export default class {
    @update([IDL.Text], IDL.Text)
    async prompt(prompt: string): Promise<string> {
        return await llm.prompt(llm.Model.Llama3_1_8B, prompt);
    }

    @update([IDL.Vec(llm.ChatMessage)], IDL.Text)
    async chat(messages: llm.ChatMessage[]): Promise<string> {
        console.log("messages received");
        console.log(messages);
        return await llm2.chat(llm2.Model.Llama3_1_8B, messages);
    }
}
