export interface GameRequest {
  id: string;
  playerName: string;
  dates: { date: Date; timespan: { from: number; to: number } }[];  
  location: string;
  skillLevel: string;  
  isOwner: boolean;
} 