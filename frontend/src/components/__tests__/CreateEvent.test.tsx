import { render, screen, fireEvent } from '@testing-library/react';
import CreateEvent from '../CreateEvent';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'createEvent.form.requestType': 'Request Type',
        'createEvent.form.single': 'Single',
        'createEvent.form.doubles': 'Doubles',
        'createEvent.form.custom': 'Custom',
        'createEvent.form.customPlayerCount': 'Number of players',
        'createEvent.form.customPlayerCountHelper': 'Enter the total number of players (2–1000)',
        'createEvent.errors.customPlayerCountInvalid': 'Number of players must be between 2 and 1000',
        'createEvent.title': 'Create Event',
        'common.close': 'Close',
      };
      if (options?.count !== undefined) {
        return `${options.count} time slots selected`;
      }
      return translations[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../services/apiProvider', () => ({
  useAPI: () => ({
    listLocations: jest.fn().mockResolvedValue([
      { id: 'loc1', name: 'Test Court' },
    ]),
    createEvent: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('../../config/featureToggles', () => ({
  useFeatureToggles: () => ({
    addPlace: false,
    calendarIntegration: false,
  }),
}));

jest.mock('../event/AvailabilityCalendar', () => {
  return function MockCalendar() {
    return <div data-testid="availability-calendar">Calendar</div>;
  };
});

jest.mock('../GoogleCalendarConnector', () => {
  return function MockGoogleCalendar() {
    return <div data-testid="google-calendar">GoogleCalendar</div>;
  };
});

jest.mock('../PlaceSearchModal', () => {
  return function MockPlaceSearch() {
    return null;
  };
});

describe('CreateEvent', () => {
  const expandForm = () => {
    const createButton = screen.getByText('Create Event');
    fireEvent.click(createButton);
  };

  it('shows Singles, Doubles, and Custom radio buttons', () => {
    render(<CreateEvent />);
    expandForm();

    expect(screen.getByLabelText('Single')).toBeInTheDocument();
    expect(screen.getByLabelText('Doubles')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom')).toBeInTheDocument();
  });

  it('Doubles radio button is enabled', () => {
    render(<CreateEvent />);
    expandForm();

    const doublesRadio = screen.getByLabelText('Doubles');
    expect(doublesRadio).not.toBeDisabled();
  });

  it('Singles is selected by default', () => {
    render(<CreateEvent />);
    expandForm();

    const singlesRadio = screen.getByLabelText('Single') as HTMLInputElement;
    expect(singlesRadio.checked).toBe(true);
  });

  it('Custom option shows number input when selected', () => {
    render(<CreateEvent />);
    expandForm();

    expect(screen.queryByLabelText('Number of players')).not.toBeInTheDocument();

    const customRadio = screen.getByLabelText('Custom');
    fireEvent.click(customRadio);

    expect(screen.getByLabelText('Number of players')).toBeInTheDocument();
  });

  it('Custom number input has correct min/max attributes', () => {
    render(<CreateEvent />);
    expandForm();

    const customRadio = screen.getByLabelText('Custom');
    fireEvent.click(customRadio);

    const numberInput = screen.getByLabelText('Number of players') as HTMLInputElement;
    expect(numberInput.min).toBe('2');
    expect(numberInput.max).toBe('1000');
    expect(numberInput.type).toBe('number');
  });

  it('number input is hidden when Singles is selected', () => {
    render(<CreateEvent />);
    expandForm();

    const customRadio = screen.getByLabelText('Custom');
    fireEvent.click(customRadio);
    expect(screen.getByLabelText('Number of players')).toBeInTheDocument();

    const singlesRadio = screen.getByLabelText('Single');
    fireEvent.click(singlesRadio);
    expect(screen.queryByLabelText('Number of players')).not.toBeInTheDocument();
  });
});
