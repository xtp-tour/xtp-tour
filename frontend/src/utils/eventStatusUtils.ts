import { components } from '../types/schema';

type ApiEvent = components['schemas']['ApiEvent'];
type EventStatus = ApiEvent['status'];

export interface StatusInfo {
  text: string;
  badgeVariant: string;
}

export const getStatusInfo = (
  status: EventStatus | undefined,
  t: (key: string) => string
): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'OPEN': {
      text: t('eventStatus.open'),
      badgeVariant: 'text-bg-primary'
    },
    'ACCEPTED': {
      text: t('eventStatus.accepted'),
      badgeVariant: 'text-bg-warning'
    },
    'CONFIRMED': {
      text: t('eventStatus.confirmed'),
      badgeVariant: 'text-bg-success'
    },
    'RESERVATION_FAILED': {
      text: t('eventStatus.reservationFailed'),
      badgeVariant: 'text-bg-danger'
    },
    'CANCELLED': {
      text: t('eventStatus.cancelled'),
      badgeVariant: 'text-bg-secondary'
    },
    'COMPLETED': {
      text: t('eventStatus.completed'),
      badgeVariant: 'text-bg-secondary'
    },
    'EXPIRED': {
      text: t('eventStatus.expired'),
      badgeVariant: 'text-bg-secondary'
    }
  };

  return statusMap[status || 'OPEN'] || {
    text: status || 'Unknown',
    badgeVariant: 'text-bg-secondary'
  };
};

export interface LocationsDisplay {
  display: string;
  overflow: number;
  all: string[];
}

export const formatLocationsList = (
  locations: string[] | undefined,
  maxDisplay: number = 5
): LocationsDisplay => {
  if (!locations || locations.length === 0) {
    return { display: '', overflow: 0, all: [] };
  }

  if (locations.length <= maxDisplay) {
    return {
      display: locations.join(', '),
      overflow: 0,
      all: locations
    };
  }

  const displayed = locations.slice(0, maxDisplay);
  return {
    display: displayed.join(', '),
    overflow: locations.length - maxDisplay,
    all: locations
  };
};

export const shouldShowExpirationTime = (event: ApiEvent): boolean => {
  if (!event.expirationTime) return false;
  return event.status === 'OPEN' || event.status === 'ACCEPTED' || event.status === 'EXPIRED';
};
