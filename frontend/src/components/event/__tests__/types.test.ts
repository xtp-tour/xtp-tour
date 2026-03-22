import { getRequestTypeLabel, getEventTitle } from '../types';

const mockT = (key: string, options?: Record<string, unknown>): string => {
  const translations: Record<string, string> = {
    'eventTypes.singles': 'Singles',
    'eventTypes.doubles': 'Doubles',
    'eventTypes.match': 'Match',
    'eventTypes.training': 'Training',
    'eventTypes.training1on1': '1-on-1 Training',
    'eventTypes.groupTraining': 'Group Training',
    'eventTypes.matchSingles': 'Match Singles',
    'eventTypes.matchDoubles': 'Match Doubles',
    'eventTypes.unorthodoxMatch': 'Unorthodox Match',
    'eventTypes.event': 'Event',
  };
  if (key === 'eventTypes.players' && options?.count) {
    return `${options.count} Players`;
  }
  return translations[key] ?? key;
};

describe('getRequestTypeLabel', () => {
  it('returns Singles for 2 players', () => {
    expect(getRequestTypeLabel(2, mockT)).toBe('Singles');
  });

  it('returns Doubles for 4 players', () => {
    expect(getRequestTypeLabel(4, mockT)).toBe('Doubles');
  });

  it('returns "N Players" for arbitrary counts', () => {
    expect(getRequestTypeLabel(6, mockT)).toBe('6 Players');
    expect(getRequestTypeLabel(8, mockT)).toBe('8 Players');
    expect(getRequestTypeLabel(100, mockT)).toBe('100 Players');
    expect(getRequestTypeLabel(3, mockT)).toBe('3 Players');
  });
});

describe('getEventTitle', () => {
  it('returns Match Singles for MATCH with 2 players', () => {
    expect(getEventTitle('MATCH', 2, mockT)).toBe('Match Singles');
  });

  it('returns Match Doubles for MATCH with 4 players', () => {
    expect(getEventTitle('MATCH', 4, mockT)).toBe('Match Doubles');
  });

  it('returns Unorthodox Match for MATCH with other player counts', () => {
    expect(getEventTitle('MATCH', 6, mockT)).toBe('Unorthodox Match');
    expect(getEventTitle('MATCH', 10, mockT)).toBe('Unorthodox Match');
  });

  it('returns 1-on-1 Training for TRAINING with 2 players', () => {
    expect(getEventTitle('TRAINING', 2, mockT)).toBe('1-on-1 Training');
  });

  it('returns Group Training for TRAINING with more than 2 players', () => {
    expect(getEventTitle('TRAINING', 4, mockT)).toBe('Group Training');
    expect(getEventTitle('TRAINING', 8, mockT)).toBe('Group Training');
  });
});
