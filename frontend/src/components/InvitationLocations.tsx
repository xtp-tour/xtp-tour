import React from 'react';

interface InvitationLocationsProps {
  locations: string[];
  selectedLocations?: string[];
  colorClass?: string;
  borderColorClass?: string;
}

const InvitationLocations: React.FC<InvitationLocationsProps> = ({
  locations,
  selectedLocations,
  colorClass = 'text-primary',
  borderColorClass = 'border-primary',
}) => {
  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        {selectedLocations ? 'Selected Locations' : 'Preferred Locations'}
      </h6>
      <div className="d-flex flex-wrap gap-2">
        {(selectedLocations || locations).map((loc: string) => (
          <div key={loc} className={`badge bg-light text-dark border ${borderColorClass} border-opacity-25 p-2`}>
            <i className={`bi bi-geo-alt me-1 ${colorClass}`}></i>
            {loc}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvitationLocations; 