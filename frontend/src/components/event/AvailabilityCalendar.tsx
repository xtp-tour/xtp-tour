import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Calendar display constants with explanations
const CALENDAR_CONSTANTS = {
  // Maximum height for scrollable calendar view to prevent excessive DOM height
  MAX_CALENDAR_HEIGHT: 420,
  // Minimum height for time slot buttons to ensure good touch targets
  MIN_BUTTON_HEIGHT: 44,
  // Minimum width for day columns to accommodate short/long month names
  MIN_COLUMN_WIDTH: 68,
  // Number of days to display in the calendar view
  DAYS_TO_SHOW: 7,
  // Default time step for calendar slots in minutes
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
}

/** Get tomorrow's date in local timezone at midnight */
function getTomorrowLocal(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Validate that a date is not in the past */
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

/** Format time for display in user's locale */
function formatTimeDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date.toLocaleTimeString(undefined, { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
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
}) => {
  const computedMinDate = useMemo(() => {
    return (minDate ? new Date(minDate) : getTomorrowLocal());
  }, [minDate]);

  // First visible day (7-day window)
  const [windowStartDate, setWindowStartDate] = useState<Date>(() => computedMinDate);

  // Convert controlled value to Set for efficient lookups
  const selectedSet = useMemo(() => new Set(value), [value]);

  // Memoize expensive calculations
  const memoizedOnChange = useCallback(onChange, [onChange]);

  // Update window start if min bound changes
  useEffect(() => {
    setWindowStartDate(prev => clampDate(prev, computedMinDate, new Date(8640000000000000)));
  }, [computedMinDate]);

  // Build time rows depending on mode
  const timeRows = useMemo(() => {
    const rows: number[] = [];
    if (nightOnly) {
      // Early hours: 00:00 .. (startHour - step)
      for (let m = 0; m <= startHour * 60 - stepMinutes; m += stepMinutes) {
        rows.push(m);
      }
      // Late hours: (endHour + step) .. (24:00 - step)
      for (let m = endHour * 60 + stepMinutes; m <= 24 * 60 - stepMinutes; m += stepMinutes) {
        rows.push(m);
      }
    } else {
      // Default daytime: startHour .. endHour inclusive
      for (let m = startHour * 60; m <= endHour * 60; m += stepMinutes) {
        rows.push(m);
      }
    }
    return rows;
  }, [nightOnly, startHour, endHour, stepMinutes]);

  const dayCols = useMemo(() => {
    const cols: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(windowStartDate, i);
      cols.push(d);
    }
    return cols;
  }, [windowStartDate]);

  const canGoPrev = useMemo(() => {
    // cannot go before minDate
    return addDays(windowStartDate, -1).getTime() >= computedMinDate.getTime();
  }, [windowStartDate, computedMinDate]);

  const canGoNext = true; // no forward limit

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    const next = addDays(windowStartDate, -7);
    setWindowStartDate(clampDate(next, computedMinDate, new Date(8640000000000000)));
  }, [canGoPrev, windowStartDate, computedMinDate]);

  const goNext = useCallback(() => {
    const next = addDays(windowStartDate, 7);
    setWindowStartDate(next);
  }, [windowStartDate]);

  const isSelected = useCallback((utcIso: string) => selectedSet.has(utcIso), [selectedSet]);

  const toggleCell = useCallback((dateOnly: Date, minutesFromMidnight: number) => {
    if (disabled) return;
    
    const localDateTime = makeLocalDateTime(dateOnly, minutesFromMidnight);
    
    // Validate this isn't a past date/time
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
    if (disabled || value.length === 0) return;
    memoizedOnChange([]);
  }, [disabled, value.length, memoizedOnChange]);



  // Memoize whether any slots are selected for performance
  const hasSelection = useMemo(() => value.length > 0, [value.length]);
  
  // Generate ARIA label for the calendar
  const calendarAriaLabel = useMemo(() => {
    const modeText = nightOnly ? 'night hours only' : 'daytime hours';
    return `Select available time slots (${modeText}). Use arrow keys to navigate, space to select.`;
  }, [nightOnly]);

  return (
    <div className={className} role="grid" aria-label={calendarAriaLabel}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <div className="btn-group" role="group" aria-label="Calendar navigation">
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
              aria-label="Previous week"
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
              aria-label="Next week"
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
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm shadow-none ms-2"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={(e) => { 
              if (!disabled) {
                clearSelection();
                (e.currentTarget as HTMLButtonElement).blur();
              }
            }}
            disabled={!hasSelection || disabled}
            aria-label="Clear all selected time slots"
            style={{ WebkitTapHighlightColor: 'transparent', backgroundColor: 'transparent' }}
          >
            Clear selection
          </button>
        </div>
      </div>

      <div className="table-responsive" style={{ maxHeight: CALENDAR_CONSTANTS.MAX_CALENDAR_HEIGHT }}>
        <table className="table table-sm table-borderless align-middle mb-0" role="grid">
          <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
            <tr role="row">
              {dayCols.map((d, idx) => (
                <th
                  key={idx}
                  className="text-center small"
                  style={{ minWidth: CALENDAR_CONSTANTS.MIN_COLUMN_WIDTH, padding: '2px 2px' }}
                  scope="col"
                  role="columnheader"
                >
                  <div className="d-flex flex-column align-items-center lh-1">
                    <span className="text-uppercase small">
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="small text-muted">
                      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map((m) => (
              <tr key={m} role="row">
                {dayCols.map((d, idx) => {
                  const localDateTime = makeLocalDateTime(d, m);
                  const iso = localDateTime.toISOString();
                  const selectedNow = isSelected(iso);
                  return (
                    <td key={idx} className="p-0" role="gridcell">
                      <button
                        type="button"
                        className={`btn btn-sm w-100 border-0 rounded-0 py-2 px-2 shadow-none small ${
                          selectedNow 
                            ? 'bg-primary text-white' 
                            : disabled 
                            ? 'bg-transparent text-muted' 
                            : 'bg-transparent text-body'
                        }`}
                        style={{ minHeight: CALENDAR_CONSTANTS.MIN_BUTTON_HEIGHT }}
                        onClick={() => toggleCell(d, m)}
                        disabled={disabled}
                        aria-pressed={selectedNow}
                        aria-label={`${formatTimeDisplay(m)} on ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${selectedNow ? ' (selected)' : ''}`}
                        tabIndex={0}
                      >
                        {formatTimeDisplay(m)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AvailabilityCalendar;
