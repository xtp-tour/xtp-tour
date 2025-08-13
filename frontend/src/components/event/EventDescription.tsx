import React from 'react';
import { getSectionTitleKey } from './types';
import { useTranslation } from 'react-i18next';

interface EventDescriptionProps {
  description?: string;
}

const EventDescription: React.FC<EventDescriptionProps> = ({
  description,
}) => {
  const { t } = useTranslation();
  if (!description) {
    return null;
  }

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">{t(getSectionTitleKey('description'))}</h6>
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