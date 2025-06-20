import React from 'react';
import { StyleProps, SECTION_TITLES } from './types';

interface EventLocationsProps extends StyleProps {
  locations: string[];
  selectedLocations?: string[];
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
}

const LocationBadge: React.FC<{
  location: string;
  colorClass: string;
  borderColorClass: string;
  isUserSelected?: boolean;
  onClick?: () => void;
}> = ({ location, colorClass, borderColorClass, isUserSelected, onClick }) => {
  // Custom styling for user-selected locations - use tennis-navy instead of accent
  const style = isUserSelected ? {
    backgroundColor: 'var(--tennis-navy, #212529)', // Navy color instead of accent
    color: 'white',
    transform: 'scale(1.05)'
  } : {
    backgroundColor: 'var(--tennis-light, #f8f9fa)',
    color: 'var(--tennis-navy, #212529)',
    border: `1px solid var(--${borderColorClass.replace('border-', '')}, #dee2e6)`,
    borderOpacity: '0.25'
  };

  const badge = (
    <div 
      className={`badge p-2`}
      style={style}
    >
      <i className={`bi bi-geo-alt me-1`} style={{ 
        color: isUserSelected ? 'white' : `var(--${colorClass.replace('text-', '')}, currentColor)`
      }}></i>
      {location}
      {onClick && <i className="bi bi-chevron-right ms-1 opacity-75"></i>}
    </div>
  );

  return onClick ? (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="text-decoration-none"
    >
      {badge}
    </a>
  ) : (
    badge
  );
};

const EventLocations: React.FC<EventLocationsProps> = ({
  locations,
  selectedLocations,
  userSelectedLocations = [],
  colorClass = 'text-primary',
  borderColorClass = 'border-primary',
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
              colorClass={colorClass}
              borderColorClass={borderColorClass}
              isUserSelected={isSelected}
              onClick={onLocationClick ? () => onLocationClick(loc) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default EventLocations; 