import { ListChallengesResponse } from '../types/api';

// Simplified API functions
export const API = {
  challenges: {
    list: async (token: string | null): Promise<ListChallengesResponse> => {
      const response = await fetch('/api/challenges', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorDetail}`);
      }

      return response.json();
    }
  }
};