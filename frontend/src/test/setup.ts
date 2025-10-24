import '@testing-library/jest-dom';

// Mock import.meta.env for Vite environment variables
(globalThis as any).import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      MODE: 'test',
    },
  },
};

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

// Mock i18n to avoid import.meta issues in tests
jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    language: 'en',
    languages: ['en', 'es', 'fr', 'pl'],
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue(undefined),
  },
})); 