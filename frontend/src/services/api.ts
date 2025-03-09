import axios, { AxiosInstance, AxiosError } from 'axios';
import { APIClient, APIConfig, CreateInvitationRequest, UpdateInvitationRequest, InvitationResponse, APIError } from '../types/api';
import { Invitation } from '../types/invitation';
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

  async createInvitation(request: CreateInvitationRequest): Promise<Invitation> {
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

  async listInvitations(params?: { page?: number; limit?: number; ownOnly?: boolean; }): Promise<InvitationResponse> {
    return this.axiosInstance.get('/invitations', { params });
  }

  async acceptInvitation(id: string): Promise<void> {
    await this.axiosInstance.post(`/invitations/${id}/accept`);
  }

  async getLocation(id: string): Promise<Location> {
    return this.axiosInstance.get(`/locations/${id}`);
  }

  async listLocations(params?: { page?: number; limit?: number; area?: string; search?: string; }): Promise<LocationResponse> {
    return this.axiosInstance.get('/locations', { params });
  }
}