export enum Area {
  Central = 'CENTRAL',
  North = 'NORTH',
  South = 'SOUTH',
  East = 'EAST',
  West = 'WEST',
}

export interface Location {
  id: string;
  name: string;
  area: Area;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  isActive: boolean;
}

export interface LocationResponse {
  locations: Location[];
  total: number;
} 