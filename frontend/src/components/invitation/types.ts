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
}

export interface ActionButton {
  variant: string;
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  customButton?: React.ReactNode;
}

export interface StyleProps {
  colorClass?: string;
  borderColorClass?: string;
}

export const SKILL_LEVEL_DESCRIPTIONS = {
  ANY: 'Any NTRP',
  BEGINNER: 'NTRP < 3.5',
  INTERMEDIATE: 'NTRP 3.5–5.0',
  ADVANCED: 'NTRP > 5.0'
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

export const getInvitationTypeLabel = (type: ApiEventType): string => {
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

export const timeSlotFromDateAndConfirmation= (date: string, confirmation?:  ApiConfirmation, isAvailable: boolean = true, ) => {
    const dateObj = moment(new Date(date));
    return {
      date: dateObj,    
      isSelected: confirmation ? 
        new Date(confirmation.datetime || '').getTime() === new Date(date || '').getTime() : 
        false,
      isAvailable: isAvailable
    }
}
