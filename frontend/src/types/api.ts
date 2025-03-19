import { Location, LocationResponse } from './locations';
import { Event as Event, EventConfirmation as EventConfirmation } from './invitation';

export interface CreateEventRequest {
   invitation: Event;
}


export interface joinEventRequest {
  id: string;
  selectedLocations: string[];
  selectedTimeSlots: {
    date: string;
    startTime: number; // in HHMM format
  }[];
}



export interface APIInvitation extends Omit<Event, 'timeSlots' | 'createdAt'> {
  timeSlots: {
    date: string;
    time: number;
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface ListEventsResponse {
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
  createEvent(request: Event): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  getEvent(id: string): Promise<Event>;
  confirmEvent(request: EventConfirmation): Promise<Event>;

  listMyEvents() : Promise<ListEventsResponse>
  listEvents(): Promise<ListEventsResponse>;  


  getAcceptanceOptions(id: string): Promise<AcceptanceOptions>;
  
  joinEvent(request: joinEventRequest): Promise<void>;
  
  // Location endpoints
  getLocation(id: string): Promise<Location>;
  listLocations(params?: {
    page?: number;
    limit?: number;
    area?: string;
    search?: string;
  }): Promise<LocationResponse>;
}
