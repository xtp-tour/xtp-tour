import React from 'react';
import { StyleProps, SECTION_TITLES } from './types';

interface InvitationLocationsProps extends StyleProps {
  locations: string[];
  selectedLocations?: string[];
  onLocationClick?: (location: string) => void;
}

const LocationBadge: React.FC<{
  location: string;
  colorClass: string;
  borderColorClass: string;
  onClick?: () => void;
}> = ({ location, colorClass, borderColorClass, onClick }) => {
  const badge = (
    <div className={`badge bg-light text-dark border ${borderColorClass} border-opacity-25 p-2`}>
      <i className={`bi bi-geo-alt me-1 ${colorClass}`}></i>
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

const InvitationLocations: React.FC<InvitationLocationsProps> = ({
  locations,
  selectedLocations,
  colorClass = 'text-primary',
  borderColorClass = 'border-primary',
  onLocationClick,
}) => (
  <div className="mb-4">
    <h6 className="text-muted mb-3">
      {selectedLocations ? SECTION_TITLES.locations.selected : SECTION_TITLES.locations.preferred}
    </h6>
    <div className="d-flex flex-wrap gap-2">
      {(selectedLocations || locations).map((loc) => (
        <LocationBadge
          key={loc}
          location={loc}
          colorClass={colorClass}
          borderColorClass={borderColorClass}
          onClick={onLocationClick ? () => onLocationClick(loc) : undefined}
        />
      ))}
    </div>
  </div>
);

export default InvitationLocations; 