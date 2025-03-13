import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'chat' : ActorMethod<
    [
      Array<
        {
          'content' : string,
          'role' : { 'user' : null } |
            { 'assistant' : null } |
            { 'system' : null },
        }
      >,
    ],
    string
  >,
  'prompt' : ActorMethod<[string], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
