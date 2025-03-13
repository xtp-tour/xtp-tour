// Here is the flow: 
// 1. UserA creates and invitations. This invitation is become visible to other players.
// 1.1 UserA can cancel his own invitation at any point before confirmation.
// 2. Users can send acks to the invitation selecting time slots and places that are available to them. Lets assume that UserB and UserC send their acks.
// 3. Those acks are visible to UserA. UserA can now select one of the acks and confirm the reservation.
// 4. UserA selects the ack of UserB. User A must make a reservation at the mutually agreed location and time. After reservation userA commits the ack of userB.
// 4.1 If userA fails to make a reservation then Acks transitions into ReservationFailed state.
// 5. UserC ack transitions into rejected state. 
// 6. After the game date/time has passed, the invitation transitions to Completed state.
// On that step the flow of the invitation is completed.

export enum SkillLevel {
  Any = 'ANY',
  Beginner = 'BEGINNER',
  Intermediate = 'INTERMEDIATE',
  Advanced = 'ADVANCED',
}

export enum ActivityType {
  Match = 'MATCH',
  Training = 'TRAINING',
}

export enum SingleDoubleType {
  Single = 'SINGLE',
  Doubles = 'DOUBLES',
}

export enum InvitationStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Confirmed = 'CONFIRMED', // all players agreed and reservation is made  
  Cancelled = 'CANCELLED', // owner cancelled the invitation
  ReservationFailed = 'RESERVATION_FAILED', // owner failed to make a reservation
  Completed = 'COMPLETED', // game/training session has occurred
}

export interface SessionTimeSlot {
  date: Date; 
  time: number;  // time in HHMM format (e.g., 1430 for 14:30)
}

export enum AckStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED', // owner rejected the ack
  Cancelled = 'CANCELLED', // userB cancelled his ack
  ReservationFailed = 'RESERVATION_FAILED', // owner failed to make a reservation
}

// That's the record of players accepting an invitation
export interface Acks {
  userId: string;
  locations: string[];
  timeSlots: SessionTimeSlot[];
  status: AckStatus;
  comment?: string;
  createdAt: Date;  
}

// When owner reserves the court and confirms the reservation.
export interface Reservation {
  location: string; // location ID 
  date: Date;
  time: number; // time in HHMM format (e.g., 1430 for 14:30)
  duration: number; // duration in minutes
  playerBId: string; // player who accepted an invitation  
  createdAt: Date;  
}

export interface Invitation {
  id: string;
  ownerId: string;  // Clerk user ID
  locations: string[];  // Array of location IDs
  skillLevel: SkillLevel;
  invitationType: ActivityType;
  requestType: SingleDoubleType;
  sessionDuration: number;  // in hours
  timeSlots: SessionTimeSlot[];  // available time slots for the session
  description?: string;  
  status: InvitationStatus;
  createdAt: Date;
  acks: Acks[]; 
  reservation?: Reservation;
} 