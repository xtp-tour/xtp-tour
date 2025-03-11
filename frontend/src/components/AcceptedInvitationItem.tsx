import React from 'react';
import { Invitation, InvitationType, RequestType, InvitationDate } from '../types/invitation';
import { formatTime } from '../utils/dateUtils';

interface Props {
  invitation: Invitation;
}

type TimeSlotType = InvitationDate | { date: string; startTime: number; };

const AcceptedInvitationItem: React.FC<Props> = ({ invitation }) => {
  const getInvitationTypeLabel = (type: InvitationType) => {
    switch (type) {
      case InvitationType.Match:
        return 'Match';
      case InvitationType.Training:
        return 'Training';
      default:
        return type;
    }
  };

  const getRequestTypeLabel = (type: RequestType) => {
    switch (type) {
      case RequestType.Single:
        return 'Single';
      case RequestType.Doubles:
        return 'Doubles';
      default:
        return type;
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
        <div className="d-flex align-items-center">
          <div className="me-2">
            <div className="rounded-circle bg-success bg-opacity-10 p-2">
              <i className="bi bi-person-circle text-success"></i>
            </div>
          </div>
          <div>
            <h6 className="mb-0">{invitation.playerId}</h6>
            <small className="text-success">Host</small>
          </div>
        </div>
        <div>
          <small className="text-muted">
            <i className="bi bi-clock-history me-1"></i>
            Accepted {invitation.updatedAt?.toLocaleDateString()}
          </small>
        </div>
      </div>

      <div className="card-body">
        <div className="d-flex gap-2 mb-4">
          <span className="badge bg-success">Accepted</span>
          <span className="badge bg-primary">{getInvitationTypeLabel(invitation.invitationType)}</span>
          <span className="badge bg-secondary">{getRequestTypeLabel(invitation.requestType)}</span>
          <span className="badge bg-info">{invitation.skillLevel}</span>
          <span className="badge bg-dark">
            <i className="bi bi-stopwatch me-1"></i>
            {invitation.matchDuration * 60} min
          </span>
        </div>

        <div className="mb-4">
          <h6 className="text-muted mb-3">Selected Locations</h6>
          <div className="d-flex flex-wrap gap-2">
            {(invitation.selectedLocations || invitation.locations).map((loc: string) => (
              <div key={loc} className="badge bg-light text-dark border border-success border-opacity-25 p-2">
                <i className="bi bi-geo-alt me-1 text-success"></i>
                {loc}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h6 className="text-muted mb-3">Selected Times</h6>
          <div className="d-flex flex-column gap-1">
            {(invitation.selectedTimeSlots || invitation.dates).map((timeSlot: TimeSlotType, index: number) => {
              // Handle both APIInvitation selectedTimeSlots and regular dates format
              const date = 'startTime' in timeSlot ? timeSlot.date : timeSlot.date.toISOString().split('T')[0];
              const time = 'startTime' in timeSlot ? timeSlot.startTime : timeSlot.timespan.from;
              const endTime = 'startTime' in timeSlot 
                ? time + Math.floor(invitation.matchDuration) * 100 + (invitation.matchDuration % 1) * 60 // Handle fractional hours
                : timeSlot.timespan.to;

              return (
                <div key={index} className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-event text-success"></i>
                  <span className="fw-medium text-nowrap">{new Date(date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                  <i className="bi bi-clock text-muted"></i>
                  <span className="text-muted text-nowrap">
                    {formatTime(time)} - {formatTime(endTime)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {invitation.description && (
          <div className="mb-4">
            <h6 className="text-muted mb-3">Description</h6>
            <div className="card bg-light border-0">
              <div className="card-body">
                <p className="card-text mb-0 ps-4">
                  {invitation.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptedInvitationItem; 