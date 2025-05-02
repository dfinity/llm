import Chat "../src/chat";
import Tool "../src/tool";
import { test } "mo:test";

test(
    "create chat builder",
    func() {
        let builder = Chat.ChatBuilder(#Llama3_1_8B);

        let request = builder.build();
        assert request == {
            model = "llama3.1:8b";
            messages = [];
            tools = null;
        };
    },
);

test(
    "chat builder with messages",
    func() {
        let messages : [Chat.ChatMessage] = [
            #system_ { content = "You are a helpful assistant" },
            #user { content = "Hello" },
        ];

        let builder = Chat.ChatBuilder(#Llama3_1_8B).withMessages(messages);
        
        let request = builder.build();
        assert request == {
            model = "llama3.1:8b";
            messages = messages;
            tools = null;
        };
    },
);

test(
    "chat builder with tools",
    func() {
        let tool = (Tool.ToolBuilder("test_tool"))
            .withDescription("A test tool")
            .build();

        let builder = Chat.ChatBuilder(#Llama3_1_8B).withTools([tool]);
        
        let request = builder.build();
        assert request == {
            model = "llama3.1:8b";
            messages = [];
            tools = ?[tool];
        };
    },
);

test(
    "chat builder with messages and tools",
    func() {
        let messages : [Chat.ChatMessage] = [
            #user { content = "Hello" },
        ];

        let tool = (Tool.ToolBuilder("test_tool")).build();

        let builder = Chat.ChatBuilder(#Llama3_1_8B)
            .withMessages(messages)
            .withTools([tool]);
            
        let request = builder.build();
        assert request == {
            model = "llama3.1:8b";
            messages = messages;
            tools = ?[tool];
        };
    },
);

test(
    "function call get",
    func() {
        let function_call : Tool.FunctionCall = {
            name = "test_function";
            arguments = [
                {
                    name = "arg1";
                    value = "value1";
                },
                {
                    name = "arg2";
                    value = "value2";
                },
            ];
        };

        assert Tool.getArgument(function_call, "arg1") == ?"value1";
        assert Tool.getArgument(function_call, "arg2") == ?"value2";
        assert Tool.getArgument(function_call, "arg3") == null;
    },
);

test(
    "model to text conversion",
    func() {
        assert Chat.modelToText(#Llama3_1_8B) == "llama3.1:8b";
    },
); 
