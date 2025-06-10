// Mock implementation of azle for testing
export const call = jest.fn();

export const IDL = {
  Record: jest.fn(),
  Vec: jest.fn(),
  Text: 'text',
  Opt: jest.fn(),
  Variant: jest.fn(),
  Null: 'null',
};

// Mock any other azle exports that might be needed
export default {
  call,
  IDL,
}; 