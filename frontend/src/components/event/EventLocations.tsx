import React from 'react';
import { SECTION_TITLES } from './types';
import { LocationBadge } from './EventBadges';

interface EventLocationsProps {
  locations: string[];
  selectedLocations?: string[];
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
}

const EventLocations: React.FC<EventLocationsProps> = ({
  locations,
  selectedLocations,
  userSelectedLocations = [],
  onLocationClick,
}) => {
  console.log('User selected locations:', userSelectedLocations);
  
  // Determine title based on locations status
  let title;
  if (userSelectedLocations.length > 0) {
    title = "Your Selected Locations";
  } else if (selectedLocations) {
    title = SECTION_TITLES.locations.selected;
  } else {
    title = SECTION_TITLES.locations.preferred;
  }

  // Determine which locations to show
  const locationsToShow = selectedLocations || locations;

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        {title}
      </h6>
      <div className="d-flex flex-wrap gap-2">
        {locationsToShow.map((loc) => {
          const isSelected = userSelectedLocations.includes(loc);
          console.log(`Location ${loc} is ${isSelected ? 'selected' : 'not selected'}`);
          
          return (
            <LocationBadge
              key={loc}
              location={loc}
              isSelected={isSelected}
              onClick={onLocationClick ? () => onLocationClick(loc) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default EventLocations; 