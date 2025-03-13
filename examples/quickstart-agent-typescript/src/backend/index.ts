import { IDL, update, call } from 'azle';
import { chat_message, chat_request, role } from 'azle/canisters/llm/idl';

// TypeScript version of the Rust library
export namespace ic_llm {
    // The principal of the LLM canister
    const LLM_CANISTER = 'w36hm-eqaaa-aaaal-qr76a-cai';

    // Role enum equivalent
    export enum Role {
        System = 'system',
        User = 'user',
        Assistant = 'assistant'
    }

    // ChatMessage type that works with the IDL system
    export type ChatMessage = chat_message;

    // Utility function to create a ChatMessage with our Role enum
    export function createChatMessage(role: Role, content: string): ChatMessage {
        // Create the appropriate role variant based on our Role enum
        let canisterRole: role;
        
        switch(role) {
            case Role.System:
                canisterRole = { system: null };
                break;
            case Role.User:
                canisterRole = { user: null };
                break;
            case Role.Assistant:
                canisterRole = { assistant: null };
                break;
            default:
                canisterRole = { user: null }; // Default to user if unknown
        }
        
        return {
            role: canisterRole,
            content: content
        };
    }

    // Utility function to get the Role enum from a ChatMessage
    export function getRoleFromMessage(message: ChatMessage): Role {
        if ('system' in message.role) {
            return Role.System;
        } else if ('user' in message.role) {
            return Role.User;
        } else if ('assistant' in message.role) {
            return Role.Assistant;
        } else {
            // Default to User if unknown
            return Role.User;
        }
    }

    // Model enum equivalent
    export enum Model {
        Llama3_1_8B = 'llama3.1:8b'
    }

    // Sends a single message to a model
    export async function prompt(model: Model, promptStr: string): Promise<string> {
        const message = createChatMessage(Role.User, promptStr);
        return await chat(model, [message]);
    }

    // Sends a list of messages to a model
    export async function chat(model: Model, messages: ChatMessage[]): Promise<string> {
        const chatRequest: chat_request = {
            model: model,
            messages: messages
        };

        const response = await call<[chat_request], string>(
            LLM_CANISTER,
            'v0_chat',
            {
                paramIdlTypes: [chat_request],
                returnIdlType: IDL.Text,
                args: [chatRequest]
            }
        );

        return response;
    }
}

// Original class implementation
export default class {
    @update([IDL.Text], IDL.Text)
    async prompt(prompt: string): Promise<string> {
        return await ic_llm.prompt(ic_llm.Model.Llama3_1_8B, prompt);
    }

    @update([IDL.Vec(chat_message)], IDL.Text)
    async chat(messages: ic_llm.ChatMessage[]): Promise<string> {
        return await ic_llm.chat(ic_llm.Model.Llama3_1_8B, messages);
    }
}
