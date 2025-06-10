import {
  createUserMessage,
  createSystemMessage,
  createAssistantMessage,
  createToolMessage,
  FunctionCallHelper,
  ChatMessage,
  ToolCall,
  FunctionCall,
  ToolCallArgument,
} from '../src/index';

describe('Message Creation Functions', () => {
  test('should create user message', () => {
    const message = createUserMessage('Hello world');
    
    expect(message).toEqual({
      user: { content: 'Hello world' }
    });
  });

  test('should create system message', () => {
    const message = createSystemMessage('You are a helpful assistant');
    
    expect(message).toEqual({
      system: { content: 'You are a helpful assistant' }
    });
  });

  test('should create assistant message with content only', () => {
    const message = createAssistantMessage('Hello! How can I help?');
    
    expect(message).toEqual({
      assistant: {
        content: 'Hello! How can I help?',
        tool_calls: []
      }
    });
  });

  test('should create assistant message with tool calls', () => {
    const toolCall: ToolCall = {
      id: 'call_123',
      function: {
        name: 'get_weather',
        arguments: [{ name: 'location', value: 'San Francisco' }]
      }
    };

    const message = createAssistantMessage(undefined, [toolCall]);
    
    expect(message).toEqual({
      assistant: {
        content: undefined,
        tool_calls: [toolCall]
      }
    });
  });

  test('should create tool message', () => {
    const message = createToolMessage('Weather: 72°F, sunny', 'call_123');
    
    expect(message).toEqual({
      tool: {
        content: 'Weather: 72°F, sunny',
        tool_call_id: 'call_123'
      }
    });
  });
});

describe('FunctionCallHelper', () => {
  const mockFunctionCall: FunctionCall = {
    name: 'get_weather',
    arguments: [
      { name: 'location', value: 'San Francisco' },
      { name: 'unit', value: 'celsius' },
      { name: 'include_forecast', value: 'true' }
    ]
  };

  test('should extract existing argument', () => {
    const helper = new FunctionCallHelper(mockFunctionCall);
    
    expect(helper.get('location')).toBe('San Francisco');
    expect(helper.get('unit')).toBe('celsius');
    expect(helper.get('include_forecast')).toBe('true');
  });

  test('should return undefined for non-existing argument', () => {
    const helper = new FunctionCallHelper(mockFunctionCall);
    
    expect(helper.get('non_existing')).toBeUndefined();
  });

  test('should handle empty arguments array', () => {
    const emptyFunctionCall: FunctionCall = {
      name: 'simple_function',
      arguments: []
    };
    
    const helper = new FunctionCallHelper(emptyFunctionCall);
    
    expect(helper.get('any_param')).toBeUndefined();
  });

  test('should handle function call with single argument', () => {
    const singleArgFunctionCall: FunctionCall = {
      name: 'get_time',
      arguments: [{ name: 'timezone', value: 'UTC' }]
    };
    
    const helper = new FunctionCallHelper(singleArgFunctionCall);
    
    expect(helper.get('timezone')).toBe('UTC');
    expect(helper.get('format')).toBeUndefined();
  });
});

describe('Message Type Validation', () => {
  test('should validate user message structure', () => {
    const userMessage = createUserMessage('Test');
    
    expect('user' in userMessage).toBe(true);
    expect('system' in userMessage).toBe(false);
    expect('assistant' in userMessage).toBe(false);
    expect('tool' in userMessage).toBe(false);
  });

  test('should validate system message structure', () => {
    const systemMessage = createSystemMessage('Test');
    
    expect('user' in systemMessage).toBe(false);
    expect('system' in systemMessage).toBe(true);
    expect('assistant' in systemMessage).toBe(false);
    expect('tool' in systemMessage).toBe(false);
  });

  test('should validate assistant message structure', () => {
    const assistantMessage = createAssistantMessage('Test');
    
    expect('user' in assistantMessage).toBe(false);
    expect('system' in assistantMessage).toBe(false);
    expect('assistant' in assistantMessage).toBe(true);
    expect('tool' in assistantMessage).toBe(false);
  });

  test('should validate tool message structure', () => {
    const toolMessage = createToolMessage('Result', 'call_123');
    
    expect('user' in toolMessage).toBe(false);
    expect('system' in toolMessage).toBe(false);
    expect('assistant' in toolMessage).toBe(false);
    expect('tool' in toolMessage).toBe(true);
  });
}); 