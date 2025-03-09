export enum SkillLevel {
  Any = 'ANY',
  Beginner = 'BEGINNER',
  Intermediate = 'INTERMEDIATE',
  Advanced = 'ADVANCED',
}

export enum InvitationType {
  Match = 'MATCH',
  Training = 'TRAINING',
}

export enum RequestType {
  Single = 'SINGLE',
  Doubles = 'DOUBLES',
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  [SkillLevel.Any]: 'Any skill level',
  [SkillLevel.Beginner]: 'Beginner (NTRP < 3.5)',
  [SkillLevel.Intermediate]: 'Intermediate (NTRP 3.5–5.0)',
  [SkillLevel.Advanced]: 'Advanced (NTRP > 5.0)',
};

export interface DateTimeSlot {
  id: number;
  date: string;
  timeFrom: string;
  timeTo: string;
}

export interface Location {
  id: string;
  name: string;
  area: string;
}

export interface Invitation {
  id: string;
  playerName: string;
  dates: {
    date: Date;
    timespan: {
      from: number;
      to: number;
    };
  }[];
  location: string;
  skillLevel: string;
  isOwner: boolean;
} 