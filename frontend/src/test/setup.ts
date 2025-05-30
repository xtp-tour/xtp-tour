import '@testing-library/jest-dom';

// Mock window.matchMedia for components that use responsive hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Clerk authentication
jest.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
    },
    isLoaded: true,
  }),
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock bootstrap components that require DOM manipulation
jest.mock('bootstrap', () => ({
  Tooltip: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
  })),
  Toast: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    hide: jest.fn(),
  })),
}));

// Mock bootstrap-select
jest.mock('use-bootstrap-select', () => ({
  __esModule: true,
  default: {
    clearAll: jest.fn(),
    getOrCreateInstance: jest.fn().mockReturnValue({
      setValue: jest.fn(),
    }),
  },
})); 