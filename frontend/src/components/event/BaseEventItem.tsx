import React, { useState } from 'react';
import { components } from '../../types/schema';
import EventHeader from './EventHeader';
import DefaultEventBody from './DefaultEventBody';
import ConfirmedEventBody from './ConfirmedEventBody';
import { ActionButton, StyleProps, TimeSlot } from './types';
import { formatTimeSlotSummary } from '../../utils/dateUtils';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

type ApiEvent = components['schemas']['ApiEvent'];

interface BaseEventItemProps extends StyleProps {
  event: ApiEvent;
  headerTitle: string;
  headerSubtitle?: string | React.ReactNode;
  timeSlots: TimeSlot[];
  timestamp: moment.Moment;
  actionButton: ActionButton;
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
  defaultCollapsed?: boolean;
  isMyEvent?: boolean;
  children?: React.ReactNode;
  shareButton?: React.ReactNode;
}

const BaseEventItem: React.FC<BaseEventItemProps> = ({
  event,
  headerTitle,
  headerSubtitle,
  colorClass = 'text-primary',
  timeSlots,
  timestamp,
  actionButton,
  userSelectedLocations,
  onLocationClick,
  onTimeSlotClick,
  defaultCollapsed = false,
  isMyEvent = false,
  children,
  shareButton,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isConfirmed = event.status === 'CONFIRMED';
  
  // Update color classes for confirmed events - use navy instead of green
  if (isConfirmed) {
    colorClass = 'text-primary';
  }

  return (
    <div className="card mb-4 shadow-sm border-0" style={{ 
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'all 0.2s ease-in-out'
    }}>
      {/* Modern Card Header */}
      <div className="card-header bg-white border-0 p-0">
        <EventHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          actionButton={actionButton}
          timeSlotSummary={formatTimeSlotSummary(timeSlots, t)}
          joinedCount={event.joinRequests?.filter(req => req.isRejected === false).length || 0}
          event={event}
          shareButton={shareButton}
        />
      </div>

      {/* Expandable Content */}
      {!isCollapsed && (
        <div className="border-top" style={{ borderColor: '#f0f0f0 !important' }}>
          {isConfirmed ? (
            <ConfirmedEventBody
              event={event}
              colorClass={colorClass}
              timeSlots={timeSlots}
              timestamp={timestamp}
            >
              {children}
            </ConfirmedEventBody>
          ) : (
            <DefaultEventBody
              event={event}
              timeSlots={timeSlots}
              timestamp={timestamp}
              userSelectedLocations={userSelectedLocations}
              onLocationClick={onLocationClick}
              onTimeSlotClick={onTimeSlotClick}
              isMyEvent={isMyEvent}
            >
              {children}
            </DefaultEventBody>
          )}
        </div>
      )}
      
      {/* Modern Expand/Collapse Button */}
      <div className="card-footer bg-white border-0 p-0">
        <button
          type="button"
          className="w-100 d-flex justify-content-center align-items-center border-0 bg-transparent text-muted hover-bg-light"
          style={{ 
            borderTop: '1px solid #f0f0f0',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s ease-in-out'
          }}
          aria-label={isCollapsed ? 'Show event details' : 'Hide event details'}
          aria-expanded={!isCollapsed}
          onClick={(e) => {
            setIsCollapsed(!isCollapsed);
            e.currentTarget.blur();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'} me-2`} 
             aria-hidden="true" 
             style={{ fontSize: '0.875rem', color: 'var(--tennis-navy)' }}></i>
          <span style={{ color: 'var(--tennis-navy)' }}>
            {isCollapsed ? t('common.showDetails') : t('common.hideDetails')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BaseEventItem; 