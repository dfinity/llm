import { IDL, update } from 'azle';
import * as llm from "@dfinity/llm";

// Define the ChatMessage IDL type
const ChatMessageIDL = IDL.Record({
    content: IDL.Text,
    role: IDL.Variant({
        user: IDL.Null,
        assistant: IDL.Null,
        system: IDL.Null
    })
});

export default class {
    @update([IDL.Text], IDL.Text)
    async prompt(prompt: string): Promise<string> {
        return await llm.prompt(llm.Model.Llama3_1_8B, prompt);
    }

    // This works
    @update([IDL.Vec(ChatMessageIDL)], IDL.Text)
    // This doesn't work
    // @update([IDL.Vec(llm.ChatMessage)], IDL.Text)
    // Causes the following deserialization error:
    // AgentError: Call failed:
    // Canister: bkyz2-fmaaa-aaaaa-qaaaq-cai
    // Method: chat (update)
    // "Request ID": "17044c7c8762cc0deef6a3e8cf374881b32d7a1d186545fe777ff313b4b61956"
    // "Error code": "IC0503"
    // "Reject code": "5"
    // "Reject message": "Error from Canister bkyz2-fmaaa-aaaaa-qaaaq-cai: Canister called `ic0.trap` with message: Uncaught Error: Failed to decode Candid bytes: Error: type mismatch: type on the wire rec_1, expect type record {content:text; role:variant {user:null; assistant:null; system:null}}\n    at idlDecode (.azle/agent-backend/main.js:5270:15)\n    at decodeArgs (.azle/agent-backend/main.js:5206:37)\n    at executeAndReplyWithCandidSerde (.azle/agent-backend/main.js:5188:5)\n    at <anonymous> (.azle/agent-backend/main.js:5448:13)\n. */
    async chat(messages: llm.ChatMessage[]): Promise<string> {
        return await llm.chat(llm.Model.Llama3_1_8B, messages);
    }
}
