export const idlFactory = ({ IDL }) => {
  const ChatMessage = IDL.Record({
    'content' : IDL.Text,
    'role' : IDL.Variant({
      'user' : IDL.Null,
      'assistant' : IDL.Null,
      'system' : IDL.Null,
    }),
  });
  return IDL.Service({
    'chat' : IDL.Func([IDL.Vec(ChatMessage)], [IDL.Text], []),
    'prompt' : IDL.Func([IDL.Text], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
