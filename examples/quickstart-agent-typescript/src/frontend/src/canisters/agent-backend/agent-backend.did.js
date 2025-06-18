export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'chat' : IDL.Func(
        [
          IDL.Vec(
            IDL.Variant({
              'user' : IDL.Record({ 'content' : IDL.Text }),
              'assistant' : IDL.Record({
                'content' : IDL.Opt(IDL.Text),
                'tool_calls' : IDL.Vec(
                  IDL.Record({
                    'id' : IDL.Text,
                    'function' : IDL.Record({
                      'name' : IDL.Text,
                      'arguments' : IDL.Vec(
                        IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text })
                      ),
                    }),
                  })
                ),
              }),
              'system' : IDL.Record({ 'content' : IDL.Text }),
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
