import React from 'react';

interface InvitationDescriptionProps {
  description?: string;
}

const InvitationDescription: React.FC<InvitationDescriptionProps> = ({
  description,
}) => {
  if (!description) {
    return null;
  }

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">Description</h6>
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

export default InvitationDescription; 