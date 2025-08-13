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
}

export interface StyleProps {
  colorClass?: string;
}

export const SKILL_LEVEL_LABELS = {
  ANY: 'Any NTRP',
  BEGINNER: 'NTRP < 3.5',
  INTERMEDIATE: 'NTRP 3.5–5.0',
  ADVANCED: 'NTRP > 5.0'
} as const;

export const SKILL_LEVEL_HINTS = {
  ANY: 'Open to all skill levels',
  BEGINNER: 'New to intermediate players learning fundamentals',
  INTERMEDIATE: 'Consistent players with developed strokes and strategy',
  ADVANCED: 'Elite players with tournament experience and advanced skills'
} as const;

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

export const SECTION_TITLES = {
  locations: {
    selected: 'Selected Locations',
    preferred: 'Preferred Locations'
  },
  timeSlots: {
    selected: 'Start Times',
    available: 'Available Start Times'
  },
  description: 'Description'
} as const;

export const getEventTypeLabel = (type: ApiEventType): string => {
  switch (type) {
    case 'MATCH':
      return 'Match';
    case 'TRAINING':
      return 'Training';
    default:
      return type;
  }
};

export const getRequestTypeLabel = (expectedPlayers: number): string => {
  switch (expectedPlayers) {
    case 2:
      return 'Singles';
    case 4:
      return 'Doubles';
    default:
      return `${expectedPlayers} Players`;
  }
};

export const getEventTitle = (eventType: ApiEventType, expectedPlayers: number): string => {
  switch (eventType) {
    case 'TRAINING':
      if (expectedPlayers === 2) {
        return 'Training 1 on 1';
      } else {
        return 'Group Training';
      }
    case 'MATCH':
      if (expectedPlayers === 2) {
        return 'Match Singles';
      } else if (expectedPlayers === 4) {
        return 'Match Doubles';
      } else {
        return 'Unorthodox Match';
      }
    default:
      return `${getEventTypeLabel(eventType)} Event`;
  }
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