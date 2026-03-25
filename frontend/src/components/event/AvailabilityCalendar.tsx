import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPI } from '../../services/apiProvider';
import moment from 'moment';
import { components } from '../../types/schema';
import {
  formatLongDateForLocale,
  formatMinutesSinceMidnightLocalized,
  formatMonthDayShortForLocale,
  formatWeekdayShortForLocale,
} from '../../utils/i18nDateUtils';

const CALENDAR_CONSTANTS = {
  MIN_BUTTON_HEIGHT: 44,
  DAYS_TO_SHOW: 7,
  DEFAULT_STEP_MINUTES: 30,
} as const;

interface AvailabilityCalendarProps {
  /** Callback when selection changes - emits selected start timestamps (UTC ISO) */
  onChange: (utcIsoStartTimes: string[]) => void;
  /** Optional initial selection (UTC ISO strings) */
  value?: string[];
  /** Inclusive minimum date, defaults to tomorrow (local) */
  minDate?: Date;
  /** Earliest start hour (local), default 8 */
  startHour?: number;
  /** Latest end hour boundary (local), default 21 */
  endHour?: number;
  /** Time slot granularity in minutes, default 30 */
  stepMinutes?: number;
  /** When true, show only hours outside normal range */
  nightOnly?: boolean;
  /** Optional class name for styling */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Calendar integration settings */
  calendarIntegration?: {
    enabled: boolean;
    onCalendarConnect?: () => void;
  };
}

function getTomorrowLocal(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface BusyPeriod {
  start: string;
  end: string;
  title?: string;
}

interface AllDayEvent {
  date: string;
  title: string;
}

function isValidFutureDate(date: Date, minDate: Date): boolean {
  return date.getTime() >= minDate.getTime();
}

function addDays(date: Date, numDays: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + numDays);
  return d;
}

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date.getTime() < min.getTime()) return new Date(min);
  if (date.getTime() > max.getTime()) return new Date(max);
  return date;
}

function makeLocalDateTime(dateOnly: Date, minutesFromMidnight: number): Date {
  const d = new Date(dateOnly);
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onChange,
  value = [],
  minDate,
  startHour = 8,
  endHour = 21,
  stepMinutes = CALENDAR_CONSTANTS.DEFAULT_STEP_MINUTES,
  nightOnly = false,
  className = '',
  disabled = false,
  calendarIntegration,
}) => {
  const { t } = useTranslation();
  const api = useAPI();
  const [busyTimes, setBusyTimes] = useState<BusyPeriod[]>([]);
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false);
  const [allDayEvents, setAllDayEvents] = useState<Map<string, AllDayEvent[]>>(new Map());
  const [activeDay, setActiveDay] = useState(0);

  const computedMinDate = useMemo(() => {
    return (minDate ? new Date(minDate) : getTomorrowLocal());
  }, [minDate]);

  const [windowStartDate, setWindowStartDate] = useState<Date>(() => computedMinDate);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const memoizedOnChange = useCallback(onChange, [onChange]);

  const timeRows = useMemo(() => {
    const rows: number[] = [];
    if (nightOnly) {
      for (let m = 0; m <= startHour * 60 - stepMinutes; m += stepMinutes) {
        rows.push(m);
      }
      for (let m = endHour * 60 + stepMinutes; m <= 24 * 60 - stepMinutes; m += stepMinutes) {
        rows.push(m);
      }
    } else {
      for (let m = startHour * 60; m <= endHour * 60; m += stepMinutes) {
        rows.push(m);
      }
    }
    return rows;
  }, [nightOnly, startHour, endHour, stepMinutes]);

  const dayCols = useMemo(() => {
    const cols: Date[] = [];
    for (let i = 0; i < 7; i++) {
      cols.push(addDays(windowStartDate, i));
    }
    return cols;
  }, [windowStartDate]);

  const canGoPrev = useMemo(() => {
    return addDays(windowStartDate, -1).getTime() >= computedMinDate.getTime();
  }, [windowStartDate, computedMinDate]);

  const canGoNext = true;

  // Count selections per day for dot indicators
  const selectionsPerDay = useMemo(() => {
    const counts = new Map<number, number>();
    value.forEach(iso => {
      const d = new Date(iso);
      dayCols.forEach((col, idx) => {
        if (d.getFullYear() === col.getFullYear() &&
            d.getMonth() === col.getMonth() &&
            d.getDate() === col.getDate()) {
          counts.set(idx, (counts.get(idx) || 0) + 1);
        }
      });
    });
    return counts;
  }, [value, dayCols]);

  // Fetch busy times when calendar integration is enabled or date window changes
  useEffect(() => {
    if (calendarIntegration?.enabled) {
      const fetchBusyTimes = async () => {
        setIsLoadingBusyTimes(true);
        try {
          const timeMin = windowStartDate.toISOString();
          const timeMax = addDays(windowStartDate, CALENDAR_CONSTANTS.DAYS_TO_SHOW).toISOString();
          const response = await api.getBusyTimes(timeMin, timeMax);

          const allDayMap = new Map<string, AllDayEvent[]>();
          const timedEvents: BusyPeriod[] = [];

          (response.busyPeriods || [])
            .filter((p: components['schemas']['ApiCalendarBusyPeriod']) => p.start && p.end)
            .forEach((p: components['schemas']['ApiCalendarBusyPeriod']) => {
              const start = moment(p.start!);
              const end = moment(p.end!);
              const title = p.title || 'Busy';

              const isAllDay = start.hours() === 0 && start.minutes() === 0 &&
                               end.hours() === 0 && end.minutes() === 0 &&
                               end.diff(start, 'hours') >= 24;

              if (isAllDay) {
                let currentDate = start.clone().startOf('day');
                while (currentDate.isBefore(end)) {
                  const dateKey = currentDate.format('YYYY-MM-DD');
                  if (!allDayMap.has(dateKey)) {
                    allDayMap.set(dateKey, []);
                  }
                  allDayMap.get(dateKey)!.push({ date: dateKey, title });
                  currentDate = currentDate.add(1, 'day');
                }
              } else {
                timedEvents.push({ start: p.start!, end: p.end!, title });
              }
            });

          setBusyTimes(timedEvents);
          setAllDayEvents(allDayMap);
        } catch (error) {
          console.error('Failed to fetch busy times:', error);
        } finally {
          setIsLoadingBusyTimes(false);
        }
      };
      fetchBusyTimes();
    } else {
      setBusyTimes([]);
      setAllDayEvents(new Map());
    }
  }, [calendarIntegration?.enabled, windowStartDate, api]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    const next = addDays(windowStartDate, -7);
    setWindowStartDate(clampDate(next, computedMinDate, new Date(8640000000000000)));
    setActiveDay(0);
  }, [canGoPrev, windowStartDate, computedMinDate]);

  const goNext = useCallback(() => {
    const next = addDays(windowStartDate, 7);
    setWindowStartDate(next);
    setActiveDay(0);
  }, [windowStartDate]);

  const isSelected = useCallback((utcIso: string) => selectedSet.has(utcIso), [selectedSet]);

  const busyPeriods = useMemo(
    () =>
      busyTimes.map(busyPeriod => ({
        start: moment(busyPeriod.start),
        end: moment(busyPeriod.end),
      })),
    [busyTimes]
  );

  const getSlotEvent = useCallback((localDateTime: Date): { event: BusyPeriod | null; showTitle: boolean } => {
    if (busyPeriods.length === 0) {
      return { event: null, showTitle: false };
    }
    const slotStart = moment(localDateTime);
    const slotEnd = slotStart.clone().add(stepMinutes, 'minutes');

    const event = busyTimes.find(busyPeriod => {
      const periodStart = moment(busyPeriod.start);
      const periodEnd = moment(busyPeriod.end);
      return slotStart.isBefore(periodEnd) && slotEnd.isAfter(periodStart);
    });

    if (!event) {
      return { event: null, showTitle: false };
    }

    const eventStart = moment(event.start);
    const showTitle = slotStart.isSameOrAfter(eventStart) &&
                      slotStart.isBefore(eventStart.clone().add(stepMinutes, 'minutes'));

    return { event, showTitle };
  }, [busyTimes, stepMinutes, busyPeriods.length]);

  const toggleCell = useCallback((dateOnly: Date, minutesFromMidnight: number) => {
    if (disabled) return;

    const localDateTime = makeLocalDateTime(dateOnly, minutesFromMidnight);

    if (!isValidFutureDate(localDateTime, computedMinDate)) {
      return;
    }

    const utcIso = localDateTime.toISOString();
    const currentSelected = new Set(value);

    if (currentSelected.has(utcIso)) {
      currentSelected.delete(utcIso);
    } else {
      currentSelected.add(utcIso);
    }

    memoizedOnChange(Array.from(currentSelected));
  }, [disabled, computedMinDate, value, memoizedOnChange]);

  const clearSelection = useCallback(() => {
    if (disabled || !value || value.length === 0) return;
    memoizedOnChange([]);
  }, [disabled, value, memoizedOnChange]);

  const hasSelection = useMemo(() => value && value.length > 0, [value]);

  // Count unique days with selections
  const selectedDaysCount = useMemo(() => {
    const days = new Set<string>();
    value.forEach(iso => {
      days.add(new Date(iso).toDateString());
    });
    return days.size;
  }, [value]);

  const calendarAriaLabel = useMemo(() => {
    const modeText = nightOnly
      ? t('calendar.availabilityGrid.modeNight')
      : t('calendar.availabilityGrid.modeDay');
    return t('calendar.availabilityGrid.aria', { mode: modeText });
  }, [nightOnly, t]);

  const activeDayDate = dayCols[activeDay];
  const activeDateKey = activeDayDate?.toISOString().split('T')[0];
  const activeDayAllDayEvents = allDayEvents.get(activeDateKey || '') || [];

  return (
    <div className={className} role="grid" aria-label={calendarAriaLabel}>
      {/* Navigation row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <div className="btn-group" role="group" aria-label={t('calendar.navigation')}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm shadow-none"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={(e) => {
                if (!disabled) {
                  goPrev();
                  (e.currentTarget as HTMLButtonElement).blur();
                }
              }}
              disabled={!canGoPrev || disabled}
              aria-label={t('calendar.previousWeek')}
              style={{
                WebkitTapHighlightColor: 'transparent',
                backgroundColor: 'transparent',
                color: canGoPrev ? 'var(--bs-secondary)' : undefined,
                borderColor: canGoPrev ? 'var(--bs-secondary)' : undefined,
              }}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm shadow-none"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={(e) => {
                if (!disabled) {
                  goNext();
                  (e.currentTarget as HTMLButtonElement).blur();
                }
              }}
              disabled={!canGoNext || disabled}
              aria-label={t('calendar.nextWeek')}
              style={{
                WebkitTapHighlightColor: 'transparent',
                backgroundColor: 'transparent',
                color: canGoNext ? 'var(--bs-secondary)' : undefined,
                borderColor: canGoNext ? 'var(--bs-secondary)' : undefined,
              }}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="d-flex gap-1 mb-3" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {dayCols.map((d, idx) => {
          const isActive = idx === activeDay;
          const hasSelections = selectionsPerDay.has(idx);
          return (
            <button
              key={idx}
              type="button"
              className={`btn btn-sm flex-shrink-0 shadow-none d-flex flex-column align-items-center position-relative ${
                isActive
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
              onClick={() => setActiveDay(idx)}
              style={{
                minWidth: 52,
                padding: '0.375rem 0.5rem',
                WebkitTapHighlightColor: 'transparent',
                borderRadius: '0.5rem',
                ...(isActive ? {} : { backgroundColor: 'transparent' }),
              }}
              aria-label={formatLongDateForLocale(d)}
              aria-pressed={isActive}
            >
              <span className="fw-medium" style={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                {formatWeekdayShortForLocale(d)}
              </span>
              <span style={{ fontSize: '0.7rem', lineHeight: 1.2, opacity: 0.8 }}>
                {formatMonthDayShortForLocale(d)}
              </span>
              {hasSelections && !isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bs-primary)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* All-day events banner */}
      {activeDayAllDayEvents.length > 0 && (
        <div className="mb-3">
          {activeDayAllDayEvents.map((evt, idx) => (
            <div
              key={idx}
              className="badge bg-secondary-subtle text-secondary-emphasis mb-1 me-1"
              style={{ fontSize: '0.75rem', fontWeight: 'normal' }}
            >
              <i className="bi bi-calendar-event me-1"></i>
              {evt.title}
            </div>
          ))}
        </div>
      )}

      {/* Time slot pills */}
      <div
        className="availability-time-pills"
        style={{
          display: 'grid',
          gap: '0.5rem',
          gridTemplateColumns: '1fr',
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .availability-time-pills {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `}</style>
        {timeRows.map((m) => {
          const localDateTime = makeLocalDateTime(activeDayDate, m);
          const iso = localDateTime.toISOString();
          const selectedNow = isSelected(iso);
          const { event: calendarEvent } = getSlotEvent(localDateTime);
          const hasEvent = !!calendarEvent;
          const isPast = !isValidFutureDate(localDateTime, computedMinDate);
          const isDisabled = disabled || isPast || isLoadingBusyTimes;

          return (
            <button
              key={m}
              type="button"
              className={`btn btn-sm w-100 shadow-none d-flex align-items-center ${
                selectedNow
                  ? 'btn-primary'
                  : hasEvent
                  ? 'btn-outline-secondary'
                  : isPast || disabled
                  ? 'btn-light text-muted'
                  : 'btn-outline-secondary'
              }`}
              style={{
                minHeight: CALENDAR_CONSTANTS.MIN_BUTTON_HEIGHT,
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                WebkitTapHighlightColor: 'transparent',
                ...(hasEvent && !selectedNow ? {
                  borderLeftWidth: 3,
                  borderLeftColor: 'var(--bs-secondary)',
                } : {}),
                ...(isLoadingBusyTimes ? { cursor: 'wait' } : {}),
              }}
              onClick={() => toggleCell(activeDayDate, m)}
              disabled={isDisabled}
              aria-pressed={selectedNow}
              aria-label={`${formatMinutesSinceMidnightLocalized(m)} — ${formatLongDateForLocale(activeDayDate)}${selectedNow ? ` (${t('calendar.availabilityGrid.selected')})` : ''}${hasEvent ? ` (${calendarEvent.title})` : ''}`}
              tabIndex={0}
              title={hasEvent ? calendarEvent.title : undefined}
            >
              <i className={`bi ${selectedNow ? 'bi-check-circle-fill' : 'bi-clock'} me-2`}></i>
              <span className="fw-medium" style={{ fontSize: '0.875rem' }}>
                {formatMinutesSinceMidnightLocalized(m)}
              </span>
              {hasEvent && (
                <span
                  className="ms-auto text-truncate"
                  style={{ fontSize: '0.75rem', maxWidth: '50%', opacity: 0.7 }}
                >
                  {calendarEvent.title}
                </span>
              )}
              {selectedNow && !hasEvent && (
                <i className="bi bi-check2 ms-auto"></i>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary bar */}
      {hasSelection && (
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <small className="text-muted">
            {t('calendar.slotsSelected', { count: value.length })}
            {selectedDaysCount > 1 && (
              <> &middot; {t('calendar.slotsAcrossDays', { count: selectedDaysCount })}</>
            )}
          </small>
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none shadow-none p-0"
            onClick={(e) => {
              clearSelection();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            disabled={disabled}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {t('calendar.clearAll')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
