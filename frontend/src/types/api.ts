import { Location, LocationResponse } from './locations';
import { Invitation, Reservation } from './invitation';

export interface CreateInvitationRequest {
   invitation: Invitation;
}


export interface AcceptInvitationRequest {
  id: string;
  selectedLocations: string[];
  selectedTimeSlots: {
    date: string;
    startTime: number; // in HHMM format
  }[];
}



export interface APIInvitation extends Omit<Invitation, 'timeSlots' | 'createdAt'> {
  timeSlots: {
    date: string;
    time: number;
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface InvitationsResponse {
  invitations: APIInvitation[];
  total: number;
}

export interface TimeSlotOption {
  date: string;
  time: number;
  isAvailable: boolean;
}

export interface AcceptanceOptions {
  locations: string[];
  timeSlots: TimeSlotOption[];
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIConfig {
  baseUrl: string;
  getAuthToken(): Promise<string | undefined>;
}

export interface APIClient {
  // Invitation endpoints
  createInvitation(request: Invitation): Promise<Invitation>;
  deleteInvitation(id: string): Promise<void>;
  getInvitation(id: string): Promise<Invitation>;
  confirmInvitation(request: Reservation): Promise<Invitation>;

  listMyInvitations() : Promise<InvitationsResponse>
  listInvitations(): Promise<InvitationsResponse>;  


  getAcceptanceOptions(id: string): Promise<AcceptanceOptions>;
  
  acceptInvitation(request: AcceptInvitationRequest): Promise<void>;
  
  // Location endpoints
  getLocation(id: string): Promise<Location>;
  listLocations(params?: {
    page?: number;
    limit?: number;
    area?: string;
    search?: string;
  }): Promise<LocationResponse>;
}
