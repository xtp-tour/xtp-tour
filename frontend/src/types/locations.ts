
export interface Location {
  id: string;
  name: string;  
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };  
}

export interface LocationResponse {
  locations: Location[];
  total: number;
} 