// Jest setup file
import 'jest';

// Mock azle module globally
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