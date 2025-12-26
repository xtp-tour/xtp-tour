import React from 'react';
import { components } from '../../types/schema';
import { ApiConfirmation } from '../../types/api';
import moment from 'moment';

type ApiEvent = components['schemas']['ApiEvent'];
type ApiEventType = ApiEvent['eventType'];

export interface TimeSlot {
  date: moment.Moment;
  isAvailable?: boolean;
  isSelected?: boolean;
  isUserSelected?: boolean;
}

export interface ActionButton {
  variant: string;
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  customButton?: React.ReactNode;
  statusBadge?: {
    text: string;
    variant: string;
  };
}

export interface StyleProps {
  colorClass?: string;
}

// Comprehensive NTRP level information for reference
export const NTRP_DETAILED_DESCRIPTIONS = {
  1.0: 'New Player: Just starting to learn tennis',
  1.5: 'Beginner: Limited experience, working on getting ball in play',
  2.0: 'Novice: Needs court experience, obvious stroke weaknesses',
  2.5: 'Advanced Novice: Learning ball judgment, can sustain slow rallies',
  3.0: 'Intermediate: Fairly consistent on medium-paced shots',
  3.5: 'Advanced Intermediate: Improved stroke dependability with directional control',
  4.0: 'Advanced: Dependable strokes with depth and directional control',
  4.5: 'Expert: Beginning to master power and spins, sound footwork',
  5.0: 'Elite: Good shot anticipation, can structure game around strengths',
  5.5: 'Elite+: Developed power/consistency as major weapon',
  6.0: 'Tournament: Intensive training, sectional/national ranking',
  7.0: 'Professional: World-class player'
} as const;

// Official NTRP resources for comprehensive information
export const NTRP_RESOURCES = {
  USTA_OVERVIEW: 'https://www.usta.com/en/home/coach-organize/tennis-tool-center/run-usta-programs/national/understanding-ntrp-ratings.html',
  USTA_FAQS: 'https://www.usta.com/en/home/play/adult-tennis/programs/national/usta-league-faqs.html',
  USTA_SELF_RATE: 'https://activenetwork.my.salesforce-sites.com/usta/articles/en_US/Article/League-NTRP-Rating-Information'
} as const;

// These functions now require a translation function parameter
export const getEventTypeLabel = (type: ApiEventType, t: (key: string, options?: Record<string, unknown>) => string): string => {
  switch (type) {
    case 'MATCH':
      return t('eventTypes.match');
    case 'TRAINING':
      return t('eventTypes.training');
    default:
      return type;
  }
};

export const getRequestTypeLabel = (expectedPlayers: number, t: (key: string, options?: Record<string, unknown>) => string): string => {
  switch (expectedPlayers) {
    case 2:
      return t('eventTypes.singles');
    case 4:
      return t('eventTypes.doubles');
    default:
      return t('eventTypes.players', { count: expectedPlayers });
  }
};

export const getEventTitle = (eventType: ApiEventType, expectedPlayers: number, t: (key: string, options?: Record<string, unknown>) => string): string => {
  switch (eventType) {
    case 'TRAINING':
      if (expectedPlayers === 2) {
        return t('eventTypes.training1on1');
      } else {
        return t('eventTypes.groupTraining');
      }
    case 'MATCH':
      if (expectedPlayers === 2) {
        return t('eventTypes.matchSingles');
      } else if (expectedPlayers === 4) {
        return t('eventTypes.matchDoubles');
      } else {
        return t('eventTypes.unorthodoxMatch');
      }
    default:
      return `${getEventTypeLabel(eventType, t)} ${t('eventTypes.event')}`;
  }
};

// Helper functions to get translation keys for section titles
export const getSectionTitleKey = (section: 'selectedLocations' | 'preferredLocations' | 'startTimes' | 'availableStartTimes' | 'description'): string => {
  const keyMap = {
    selectedLocations: 'eventLabels.selectedLocations',
    preferredLocations: 'eventLabels.preferredLocations',
    startTimes: 'eventLabels.startTimes',
    availableStartTimes: 'eventLabels.availableStartTimes',
    description: 'eventLabels.description'
  };
  return keyMap[section];
};

export const timeSlotFromDateAndConfirmation = (
  date: string,
  confirmation?: ApiConfirmation,
  isAvailable: boolean = true,
  isUserSelected?: boolean
): TimeSlot => {
  // Parse UTC date string into moment object and convert to local time
  const dateObj = moment.utc(date).local();

  // Check if the date matches the confirmation datetime
  const isSelected = confirmation ?
    moment.utc(confirmation.datetime).isSame(moment.utc(date)) :
    false;

  return {
    date: dateObj,
    isSelected,
    isAvailable,
    isUserSelected
  };
};