/**
 * Example test showing how to test your own implementation using the LLM library
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
  FunctionCallHelper,
} from '../src/index';

// Example: A weather service class that uses the LLM library
class WeatherChatBot {
  private weatherTool = tool('get_weather')
    .withDescription('Get current weather for a location')
    .withParameter(
      parameter('location', ParameterType.String)
        .withDescription('The city name')
        .isRequired()
    )
    .withParameter(
      parameter('unit', ParameterType.String)
        .withDescription('Temperature unit')
        .withEnumValues(['celsius', 'fahrenheit'])
    )
    .build();

  // Mock method to simulate getting weather data
  private async getWeatherData(location: string, unit: string = 'celsius'): Promise<string> {
    // In a real implementation, this would call a weather API
    const temp = unit === 'fahrenheit' ? '72°F' : '22°C';
    return `The weather in ${location} is sunny with ${temp}`;
  }

  async buildWeatherQuery(userMessage: string) {
    return chat(Model.Llama3_1_8B)
      .withMessages([
        createSystemMessage('You are a helpful weather assistant'),
        createUserMessage(userMessage)
      ])
      .withTools([this.weatherTool]);
  }

  async handleToolCall(toolCall: any): Promise<string> {
    const helper = new FunctionCallHelper(toolCall.function);
    
    if (toolCall.function.name === 'get_weather') {
      const location = helper.get('location') || 'Unknown';
      const unit = helper.get('unit') || 'celsius';
      return await this.getWeatherData(location, unit);
    }
    
    return 'Unknown tool call';
  }
}

describe('Example Usage: Weather ChatBot', () => {
  let weatherBot: WeatherChatBot;

  beforeEach(() => {
    weatherBot = new WeatherChatBot();
  });

  test('should build correct chat request for weather query', async () => {
    const chatBuilder = await weatherBot.buildWeatherQuery("What's the weather in Paris?");
    
    expect(chatBuilder).toBeDefined();
    expect(typeof chatBuilder.send).toBe('function');
  });

  test('should handle tool call with location only', async () => {
    const mockToolCall = {
      id: 'call_123',
      function: {
        name: 'get_weather',
        arguments: [
          { name: 'location', value: 'Paris' }
        ]
      }
    };

    const result = await weatherBot.handleToolCall(mockToolCall);
    expect(result).toBe('The weather in Paris is sunny with 22°C');
  });

  test('should handle tool call with location and unit', async () => {
    const mockToolCall = {
      id: 'call_456',
      function: {
        name: 'get_weather',
        arguments: [
          { name: 'location', value: 'New York' },
          { name: 'unit', value: 'fahrenheit' }
        ]
      }
    };

    const result = await weatherBot.handleToolCall(mockToolCall);
    expect(result).toBe('The weather in New York is sunny with 72°F');
  });

  test('should handle unknown tool calls gracefully', async () => {
    const mockToolCall = {
      id: 'call_789',
      function: {
        name: 'unknown_tool',
        arguments: []
      }
    };

    const result = await weatherBot.handleToolCall(mockToolCall);
    expect(result).toBe('Unknown tool call');
  });

  test('should create complete conversation flow', () => {
    // Simulate a complete conversation with tool usage
    const userMessage = createUserMessage("What's the weather in Tokyo?");
    
    const toolCall = {
      id: '123',
      function: {
        name: 'get_weather',
        arguments: [{ name: 'location', value: 'Tokyo' }]
      }
    };
    
    const assistantWithToolCall = createAssistantMessage(undefined, [toolCall]);
    const toolResponse = createToolMessage('The weather in Tokyo is sunny with 25°C', 'call_tokyo_123');
    const finalAssistant = createAssistantMessage('Based on the current data, Tokyo has lovely sunny weather at 25°C today!');

    // Verify the conversation flow structure
    expect('user' in userMessage).toBe(true);
    expect('assistant' in assistantWithToolCall).toBe(true);
    expect('tool' in toolResponse).toBe(true);
    expect('assistant' in finalAssistant).toBe(true);

    // Verify content integrity
    if ('assistant' in assistantWithToolCall) {
      expect(assistantWithToolCall.assistant.tool_calls).toHaveLength(1);
    }
    
    if ('tool' in toolResponse) {
      expect(toolResponse.tool.tool_call_id).toBe('call_tokyo_123');
    }
  });
});

// Example: Testing parameter validation
describe('Example Usage: Parameter Validation', () => {
  test('should validate required parameters are marked correctly', () => {
    const requiredParam = parameter('api_key', ParameterType.String)
      .withDescription('API key for service')
      .isRequired();

    const optionalParam = parameter('timeout', ParameterType.Number)
      .withDescription('Request timeout in seconds');

    expect(requiredParam.isRequiredProperty()).toBe(true);
    expect(optionalParam.isRequiredProperty()).toBe(false);
  });

  test('should validate enum parameters work correctly', () => {
    const formatParam = parameter('format', ParameterType.String)
      .withEnumValues(['json', 'xml', 'csv']);

    const property = formatParam.toProperty();
    expect(property.enum).toEqual(['json', 'xml', 'csv']);
  });

  test('should build complex tools with validation', () => {
    const complexTool = tool('data_export')
      .withDescription('Export data in various formats')
      .withParameter(
        parameter('dataset', ParameterType.String)
          .withDescription('The dataset to export')
          .isRequired()
      )
      .withParameter(
        parameter('format', ParameterType.String)
          .withEnumValues(['json', 'csv', 'xlsx'])
          .isRequired()
      )
      .withParameter(
        parameter('limit', ParameterType.Number)
          .withDescription('Maximum number of records')
      )
      .withParameter(
        parameter('include_headers', ParameterType.Boolean)
          .withDescription('Include column headers')
      )
      .build();

    expect(complexTool.function.name).toBe('data_export');
    expect(complexTool.function.parameters?.properties).toHaveLength(4);
    expect(complexTool.function.parameters?.required).toEqual(['dataset', 'format']);
    
    // Verify parameter types
    const properties = complexTool.function.parameters?.properties || [];
    const formatProp = properties.find(p => p.name === 'format');
    const limitProp = properties.find(p => p.name === 'limit');
    const headersProp = properties.find(p => p.name === 'include_headers');
    
    expect(formatProp?.enum).toEqual(['json', 'csv', 'xlsx']);
    expect(limitProp?.type).toBe('number');
    expect(headersProp?.type).toBe('boolean');
  });
}); 