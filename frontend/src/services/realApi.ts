import axios, { AxiosInstance, AxiosError } from 'axios';
import { APIClient, APIConfig,  ListEventsResponse, APIError, joinEventRequest, AcceptanceOptions } from '../types/api';
import { Event, EventConfirmation } from '../types/event';
import { Location, LocationResponse } from '../types/locations';

class HTTPError extends Error {
  constructor(public code: string, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'HTTPError';
  }
}

export class RealAPIClient implements APIClient {
  private config: APIConfig;
  private axiosInstance: AxiosInstance;

  constructor(config: APIConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.config.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<APIError>) => {
        if (error.response?.data) {
          const data = error.response.data;
          throw new HTTPError(
            data.code,
            data.message,
            data.details
          );
        }
        throw new HTTPError(
          'NETWORK_ERROR',
          error.message || 'A network error occurred'
        );
      }
    );
  }
  confirmEvent(_request: EventConfirmation): Promise<Event> {
    throw new Error('Method not implemented.');
  }
  listMyEvents(): Promise<ListEventsResponse> {
    throw new Error('Method not implemented.');
  }
  getAcceptanceOptions(_id: string): Promise<AcceptanceOptions> {
    throw new Error('Method not implemented.');
  }

  async createEvent(request: Event): Promise<Event> {
    return this.axiosInstance.post('/invitations', request);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.axiosInstance.delete(`/invitations/${id}`);
  }

  async getEvent(id: string): Promise<Event> {
    return this.axiosInstance.get(`/invitations/${id}`);
  }

  async listEvents(params?: { page?: number; limit?: number; ownOnly?: boolean; }): Promise<ListEventsResponse> {
    return this.axiosInstance.get('/invitations', { params });
  }

  async joinEvent(request: joinEventRequest): Promise<void> {
    return this.axiosInstance.post(`/invitations/${request.id}/ack`, request);
  }

  async getLocation(id: string): Promise<Location> {
    return this.axiosInstance.get(`/locations/${id}`);
  }

  async listLocations(params?: { page?: number; limit?: number; area?: string; search?: string; }): Promise<LocationResponse> {
    return this.axiosInstance.get('/locations', { params });
  }
}