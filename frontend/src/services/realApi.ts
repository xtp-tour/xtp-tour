import axios, { AxiosInstance, AxiosError } from 'axios';
import { APIClient, APIConfig,  InvitationsResponse, APIError, AcceptInvitationRequest, AcceptanceOptions } from '../types/api';
import { Invitation, Reservation } from '../types/invitation';
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
  confirmInvitation(request: Reservation): Promise<Invitation> {
    throw new Error('Method not implemented.');
  }
  listMyInvitations(): Promise<InvitationsResponse> {
    throw new Error('Method not implemented.');
  }
  getAcceptanceOptions(id: string): Promise<AcceptanceOptions> {
    throw new Error('Method not implemented.');
  }

  async createInvitation(request: Invitation): Promise<Invitation> {
    return this.axiosInstance.post('/invitations', request);
  }

  async updateInvitation(request: UpdateInvitationRequest): Promise<Invitation> {
    return this.axiosInstance.put(`/invitations/${request.id}`, request);
  }

  async deleteInvitation(id: string): Promise<void> {
    await this.axiosInstance.delete(`/invitations/${id}`);
  }

  async getInvitation(id: string): Promise<Invitation> {
    return this.axiosInstance.get(`/invitations/${id}`);
  }

  async listInvitations(params?: { page?: number; limit?: number; ownOnly?: boolean; }): Promise<InvitationsResponse> {
    return this.axiosInstance.get('/invitations', { params });
  }

  async acceptInvitation(request: AcceptInvitationRequest): Promise<void> {
    return this.axiosInstance.post(`/invitations/${request.id}/ack`, request);
  }

  async getLocation(id: string): Promise<Location> {
    return this.axiosInstance.get(`/locations/${id}`);
  }

  async listLocations(params?: { page?: number; limit?: number; area?: string; search?: string; }): Promise<LocationResponse> {
    return this.axiosInstance.get('/locations', { params });
  }
}