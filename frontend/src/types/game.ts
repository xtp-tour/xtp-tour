export enum SkillLevel {
  Beginner = 'BEGINNER',
  Intermediate = 'INTERMEDIATE',
  Advanced = 'ADVANCED',
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
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