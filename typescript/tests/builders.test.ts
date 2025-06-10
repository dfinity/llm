import {
  ParameterBuilder,
  ToolBuilder,
  ChatBuilder,
  ParameterType,
  Model,
  createUserMessage,
  createSystemMessage,
} from '../src/index';

describe('ParameterBuilder', () => {
  test('should create a basic parameter', () => {
    const param = new ParameterBuilder('location', ParameterType.String);
    const property = param.toProperty();

    expect(property).toEqual({
      type: 'string',
      name: 'location',
      description: undefined,
      enum: undefined,
    });
  });

  test('should create a parameter with description', () => {
    const param = new ParameterBuilder('location', ParameterType.String)
      .withDescription('The location to search for');
    const property = param.toProperty();

    expect(property).toEqual({
      type: 'string',
      name: 'location',
      description: 'The location to search for',
      enum: undefined,
    });
  });

  test('should create a required parameter', () => {
    const param = new ParameterBuilder('location', ParameterType.String)
      .isRequired();

    expect(param.isRequiredProperty()).toBe(true);
    expect(param.getName()).toBe('location');
  });

  test('should create a parameter with enum values', () => {
    const param = new ParameterBuilder('unit', ParameterType.String)
      .withEnumValues(['celsius', 'fahrenheit']);
    const property = param.toProperty();

    expect(property.enum).toEqual(['celsius', 'fahrenheit']);
  });

  test('should handle different parameter types', () => {
    const stringParam = new ParameterBuilder('name', ParameterType.String).toProperty();
    const numberParam = new ParameterBuilder('count', ParameterType.Number).toProperty();
    const boolParam = new ParameterBuilder('enabled', ParameterType.Boolean).toProperty();

    expect(stringParam.type).toBe('string');
    expect(numberParam.type).toBe('number');
    expect(boolParam.type).toBe('boolean');
  });
});

describe('ToolBuilder', () => {
  test('should create a simple tool without parameters', () => {
    const tool = new ToolBuilder('simple_tool').build();

    expect(tool).toEqual({
      function: {
        name: 'simple_tool',
      },
    });
  });

  test('should create a tool with description', () => {
    const tool = new ToolBuilder('weather_tool')
      .withDescription('Get weather information')
      .build();

    expect(tool.function.description).toBe('Get weather information');
  });

  test('should create a tool with single parameter', () => {
    const param = new ParameterBuilder('location', ParameterType.String)
      .withDescription('City name')
      .isRequired();

    const tool = new ToolBuilder('get_weather')
      .withDescription('Get weather for a location')
      .withParameter(param)
      .build();

    expect(tool).toEqual({
      function: {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: [
            {
              type: 'string',
              name: 'location',
              description: 'City name',
              enum: undefined,
            },
          ],
          required: ['location'],
        },
      },
    });
  });

  test('should create a tool with multiple parameters', () => {
    const locationParam = new ParameterBuilder('location', ParameterType.String)
      .isRequired();
    const unitParam = new ParameterBuilder('unit', ParameterType.String)
      .withEnumValues(['celsius', 'fahrenheit']);

    const tool = new ToolBuilder('get_weather')
      .withParameter(locationParam)
      .withParameter(unitParam)
      .build();

    expect(tool.function.parameters?.properties).toHaveLength(2);
    expect(tool.function.parameters?.required).toEqual(['location']);
  });

  test('should handle tools with no required parameters', () => {
    const optionalParam = new ParameterBuilder('format', ParameterType.String);

    const tool = new ToolBuilder('get_time')
      .withParameter(optionalParam)
      .build();

    expect(tool.function.parameters?.required).toBeUndefined();
  });
});

describe('ChatBuilder', () => {
  // Mock the call function since we can't actually call the canister in tests
  const mockCall = jest.fn();
  jest.mock('azle', () => ({
    call: mockCall,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a chat builder with model', () => {
    const chatBuilder = new ChatBuilder(Model.Llama3_1_8B);
    expect(chatBuilder).toBeInstanceOf(ChatBuilder);
  });

  test('should build messages correctly', () => {
    const messages = [
      createSystemMessage('You are helpful'),
      createUserMessage('Hello'),
    ];

    const chatBuilder = new ChatBuilder(Model.Llama3_1_8B)
      .withMessages(messages);

    expect(chatBuilder).toBeInstanceOf(ChatBuilder);
  });

  test('should build tools correctly', () => {
    const tool = new ToolBuilder('test_tool').build();
    const chatBuilder = new ChatBuilder(Model.Llama3_1_8B)
      .withTools([tool]);

    expect(chatBuilder).toBeInstanceOf(ChatBuilder);
  });

  test('should chain methods correctly', () => {
    const messages = [createUserMessage('Test')];
    const tool = new ToolBuilder('test_tool').build();

    const chatBuilder = new ChatBuilder(Model.Llama3_1_8B)
      .withMessages(messages)
      .withTools([tool]);

    expect(chatBuilder).toBeInstanceOf(ChatBuilder);
  });
}); 