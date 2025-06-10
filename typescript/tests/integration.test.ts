/**
 * @jest-environment node
 */

import {
  chat,
  tool,
  parameter,
  ParameterType,
  Model,
  createUserMessage,
  createSystemMessage,
  createAssistantMessage,
  createToolMessage,
} from '../src/index';

// Mock azle at the module level
jest.mock('azle', () => ({
  call: jest.fn(),
  IDL: {
    Record: jest.fn(),
    Vec: jest.fn(),
    Text: 'text',
    Opt: jest.fn(),
    Variant: jest.fn(),
  },
}));

describe('Integration Tests', () => {
  describe('Builder integration', () => {
    test('should create a complete chat request with tools', () => {
      const weatherTool = tool('get_weather')
        .withDescription('Get weather for a location')
        .withParameter(
          parameter('location', ParameterType.String)
            .withDescription('The location to get weather for')
            .isRequired()
        )
        .build();

      const chatBuilder = chat(Model.Llama3_1_8B)
        .withMessages([
          createSystemMessage('You are a helpful assistant'),
          createUserMessage("What's the weather in San Francisco?"),
        ])
        .withTools([weatherTool]);

      // Test that the builder was created successfully
      expect(chatBuilder).toBeDefined();
      expect(typeof chatBuilder.send).toBe('function');
    });

    test('should create complex tool with multiple parameters', () => {
      const complexTool = tool('calculate')
        .withDescription('Perform mathematical calculations')
        .withParameter(
          parameter('operation', ParameterType.String)
            .withDescription('The operation to perform')
            .withEnumValues(['add', 'subtract', 'multiply', 'divide'])
            .isRequired()
        )
        .withParameter(
          parameter('a', ParameterType.Number)
            .withDescription('First number')
            .isRequired()
        )
        .withParameter(
          parameter('b', ParameterType.Number)
            .withDescription('Second number')
            .isRequired()
        )
        .build();

      expect(complexTool.function.name).toBe('calculate');
      expect(complexTool.function.parameters?.properties).toHaveLength(3);
      expect(complexTool.function.parameters?.required).toEqual(['operation', 'a', 'b']);
      
      // Check parameter details
      const properties = complexTool.function.parameters?.properties || [];
      const operationParam = properties.find(p => p.name === 'operation');
      expect(operationParam?.enum).toEqual(['add', 'subtract', 'multiply', 'divide']);
    });

    test('should handle multiple tools in single request', () => {
      const weatherTool = tool('get_weather')
        .withDescription('Get weather')
        .withParameter(parameter('location', ParameterType.String).isRequired())
        .build();

      const priceTool = tool('get_price')
        .withDescription('Get ICP price')
        .build();

      const chatBuilder = chat(Model.Llama3_1_8B)
        .withMessages([createUserMessage('Help me with weather and prices')])
        .withTools([weatherTool, priceTool]);

      expect(chatBuilder).toBeDefined();
    });
  });

  describe('Message flow validation', () => {
    test('should create proper conversation flow messages', () => {
      const userMsg = createUserMessage("What's the weather?");
      const systemMsg = createSystemMessage('You are helpful');
      
      const toolCall = {
        id: 'call_123',
        function: {
          name: 'get_weather',
          arguments: [{ name: 'location', value: 'NYC' }]
        }
      };
      
      const assistantMsg = createAssistantMessage(undefined, [toolCall]);
      const toolMsg = createToolMessage('Sunny, 72°F', 'call_123');

      // Verify message structure
      expect('user' in userMsg).toBe(true);
      expect('system' in systemMsg).toBe(true);
      expect('assistant' in assistantMsg).toBe(true);
      expect('tool' in toolMsg).toBe(true);

      // Verify content
      if ('user' in userMsg) {
        expect(userMsg.user.content).toBe("What's the weather?");
      }
      
      if ('assistant' in assistantMsg) {
        expect(assistantMsg.assistant.tool_calls).toHaveLength(1);
        expect(assistantMsg.assistant.tool_calls[0].id).toBe('call_123');
      }
      
      if ('tool' in toolMsg) {
        expect(toolMsg.tool.content).toBe('Sunny, 72°F');
        expect(toolMsg.tool.tool_call_id).toBe('call_123');
      }
    });
  });

  describe('API consistency', () => {
    test('should follow builder pattern consistently', () => {
      // Test that all builders return themselves for chaining
      const paramBuilder = parameter('test', ParameterType.String)
        .withDescription('test desc')
        .isRequired();

      const toolBuilder = tool('test_tool')
        .withDescription('test tool')
        .withParameter(paramBuilder);

      const chatBuilder = chat(Model.Llama3_1_8B)
        .withMessages([createUserMessage('test')])
        .withTools([toolBuilder.build()]);

      expect(paramBuilder).toBeDefined();
      expect(toolBuilder).toBeDefined();
      expect(chatBuilder).toBeDefined();
    });

    test('should handle edge cases gracefully', () => {
      // Tool with no parameters
      const simpleTool = tool('simple').build();
      expect(simpleTool.function.parameters).toBeUndefined();

      // Parameter with no description
      const simpleParam = parameter('name', ParameterType.String).toProperty();
      expect(simpleParam.description).toBeUndefined();

      // Tool with optional parameters only
      const optionalParamTool = tool('optional_tool')
        .withParameter(parameter('optional', ParameterType.Boolean))
        .build();
      expect(optionalParamTool.function.parameters?.required).toBeUndefined();
    });
  });
}); 