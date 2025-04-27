import React from 'react';
import { SECTION_TITLES } from './types';

interface EventDescriptionProps {
  description?: string;
}

const EventDescription: React.FC<EventDescriptionProps> = ({
  description,
}) => {
  if (!description) {
    return null;
  }

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">{SECTION_TITLES.description}</h6>
      <div className="card bg-light border-0">
        <div className="card-body">
          <p className="card-text mb-0 ps-4">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDescription; 