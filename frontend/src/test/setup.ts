import '@testing-library/jest-dom';
import type { ReactNode } from 'react';

// Mock import.meta.env for Vite environment variables
Object.defineProperty(globalThis, 'import', {
	value: {
		meta: {
			env: {
				DEV: true,
				PROD: false,
				MODE: 'test',
			},
		},
	},
	configurable: true,
});

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
	ClerkProvider: ({ children }: { children: ReactNode }) => children,
	SignedIn: ({ children }: { children: ReactNode }) => children,
	SignedOut: () => null,
	useUser: () => ({
		user: {
			id: 'test-user-id',
			firstName: 'Test',
			lastName: 'User',
			emailAddresses: [{ emailAddress: 'test@example.com' }],
		},
		isLoaded: true,
	}),
	useAuth: () => ({
		getToken: jest.fn().mockResolvedValue('mock-token'),
		isLoaded: true,
		isSignedIn: true,
	}),
	useClerk: () => ({
		signOut: jest.fn().mockResolvedValue(undefined),
		user: {
			update: jest.fn().mockResolvedValue(undefined),
		},
	}),
	useSignUp: () => ({
		isLoaded: true,
		signUp: {
			create: jest.fn(),
			prepareEmailAddressVerification: jest.fn(),
			attemptEmailAddressVerification: jest.fn(),
		},
		setActive: jest.fn().mockResolvedValue(undefined),
	}),
	useSignIn: () => ({
		isLoaded: true,
		signIn: {
			create: jest.fn(),
			prepareSecondFactor: jest.fn(),
			attemptSecondFactor: jest.fn(),
		},
		setActive: jest.fn().mockResolvedValue(undefined),
	}),
}));

// Mock bootstrap components that require DOM manipulation
const MockTooltip = jest.fn().mockImplementation(() => ({
	dispose: jest.fn(),
}));
(MockTooltip as unknown as Record<string, unknown>).getInstance = jest.fn().mockReturnValue(null);

const MockToast = jest.fn().mockImplementation(() => ({
	show: jest.fn(),
	hide: jest.fn(),
}));

jest.mock('bootstrap', () => ({
	Tooltip: MockTooltip,
	Toast: MockToast,
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