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

export interface TimeSpan {
  from: number;  // time in HHMM format (e.g., 1430 for 14:30)
  to: number;    // time in HHMM format (e.g., 1600 for 16:00)
}

export interface InvitationDate {
  date: Date;
  timespan: TimeSpan;
}

export interface Invitation {
  id: string;
  playerId: string;  // Clerk user ID
  locations: string[];  // Array of location IDs
  skillLevel: SkillLevel;
  invitationType: InvitationType;
  requestType: RequestType;
  matchDuration: number;  // in hours
  dates: InvitationDate[];
  description?: string;
  isOwner: boolean;
  createdAt: Date;
  updatedAt?: Date;
} 