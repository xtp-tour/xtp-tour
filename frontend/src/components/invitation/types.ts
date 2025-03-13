import { ActivityType, SingleDoubleType } from '../../services/domain/invitation';
import { InvitationStatus } from '../../services/domain/invitation';

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
  onClick: () => void;
  disabled?: boolean;
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

export const getInvitationTypeLabel = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.Match:
      return 'Match';
    case ActivityType.Training:
      return 'Training';
    default:
      return type;
  }
};

export const getRequestTypeLabel = (type: SingleDoubleType): string => {
  switch (type) {
    case SingleDoubleType.Single:
      return 'Single';
    case SingleDoubleType.Doubles:
      return 'Doubles';
    default:
      return type;
  }
};

export enum InvitationStep {
  Created = 'CREATED',
  Pending = InvitationStatus.Pending,
  Accepted = InvitationStatus.Accepted,
  Confirmed = InvitationStatus.Confirmed,
  Rejected = InvitationStatus.Rejected
} 