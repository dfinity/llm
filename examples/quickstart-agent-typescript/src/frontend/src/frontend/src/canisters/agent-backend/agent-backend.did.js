export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'chat' : IDL.Func(
        [
          IDL.Vec(
            IDL.Record({
              'content' : IDL.Text,
              'role' : IDL.Variant({
                'user' : IDL.Null,
                'assistant' : IDL.Null,
                'system' : IDL.Null,
              }),
            })
          ),
        ],
        [IDL.Text],
        [],
      ),
    'prompt' : IDL.Func([IDL.Text], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
