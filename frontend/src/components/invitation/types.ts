import React from 'react';
import { EventType, SingleDoubleType, SkillLevel, getRequestType } from '../../types/event';

export interface TimeSlot {
  date: Date;
  time: number;
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
  [SkillLevel.Any]: 'Any NTRP',
  [SkillLevel.Beginner]: 'NTRP < 3.5',
  [SkillLevel.Intermediate]: 'NTRP 3.5–5.0',
  [SkillLevel.Advanced]: 'NTRP > 5.0'
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

export const getInvitationTypeLabel = (type: EventType): string => {
  switch (type) {
    case EventType.Match:
      return 'Match';
    case EventType.Training:
      return 'Training';
    default:
      return type;
  }
};

export const getRequestTypeLabel = (expectedPlayers: number): string => {
  const type = getRequestType(expectedPlayers);
  switch (type) {
    case SingleDoubleType.Single:
      return 'Singles';
    case SingleDoubleType.Doubles:
      return 'Doubles';
    case SingleDoubleType.Custom:
      return `${expectedPlayers} Players`;
    default:
      return 'Unknown';
  }
}; 