import React, { useState, useEffect, useRef } from 'react';
import 'use-bootstrap-select/dist/use-bootstrap-select.css'
import UseBootstrapSelect from 'use-bootstrap-select'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Tooltip, Toast } from 'bootstrap';
import { SkillLevel, ActivityType, SingleDoubleType } from '../services/domain/invitation';
import { Location, Area } from '../services/domain/locations';
import { useAPI } from '../services/api/provider';

export interface DateTimeSlot {
  id: number;
  date: string;
  time: number;
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  [SkillLevel.Any]: 'Any skill level',
  [SkillLevel.Beginner]: 'Beginner (NTRP < 3.5)',
  [SkillLevel.Intermediate]: 'Intermediate (NTRP 3.5–5.0)',
  [SkillLevel.Advanced]: 'Advanced (NTRP > 5.0)',
};

const SESSION_DURATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 1.5, label: '1.5 hours' },
  { value: 2, label: '2 hours' },
];

const LOCATIONS_BY_AREA: Record<Area, Location[]> = {
  [Area.Central]: [
    {
      id: 'central-1',
      name: 'Central Court 1',
      area: Area.Central,
      isActive: true,
    },
    {
      id: 'central-2',
      name: 'Central Court 2',
      area: Area.Central,
      isActive: true,
    },
    {
      id: 'central-3',
      name: 'Central Court 3',
      area: Area.Central,
      isActive: true,
    },
  ],
  [Area.West]: [
    {
      id: 'west-1',
      name: 'West Court 1',
      area: Area.West,
      isActive: true,
    },
    {
      id: 'west-2',
      name: 'West Court 2',
      area: Area.West,
      isActive: true,
    },
    {
      id: 'west-3',
      name: 'West Court 3',
      area: Area.West,
      isActive: true,
    },
  ],
  [Area.East]: [
    {
      id: 'east-1',
      name: 'East Court 1',
      area: Area.East,
      isActive: true,
    },
    {
      id: 'east-2',
      name: 'East Court 2',
      area: Area.East,
      isActive: true,
    },
    {
      id: 'east-3',
      name: 'East Court 3',
      area: Area.East,
      isActive: true,
    },
  ],
  [Area.North]: [
    {
      id: 'north-1',
      name: 'North Court 1',
      area: Area.North,
      isActive: true,
    },
  ],
  [Area.South]: [
    {
      id: 'south-1',
      name: 'South Court 1',
      area: Area.South,
      isActive: true,
    },
  ],
};

// Mock API call function
const mockFetchLocations = async (): Promise<Location[]> => {
  // Simulate network delay between 500ms and 1500ms
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate API failure 10% of the time
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch locations');
  }

  return LOCATIONS_BY_AREA[Area.Central];
};

const numberToTime = (time: number): string => {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const CreateInvitation: React.FC = () => {
  const api = useAPI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sessionDuration, setSessionDuration] = useState(2); // Default to 2 hours
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.Any);
  const [dateSlots, setDateSlots] = useState<DateTimeSlot[]>([
    { 
      id: 1, 
      date: getTomorrowDate(),
      time: 900 // 09:00
    }
  ]);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [invitationType, setInvitationType] = useState<ActivityType>(ActivityType.Match);
  const [description, setDescription] = useState('');
  const toastRef = useRef<HTMLDivElement>(null);
  const [requestType, setRequestType] = useState<SingleDoubleType>(SingleDoubleType.Single);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await mockFetchLocations();
        setLocations(data);

        // Initialize bootstrap-select after locations are loaded
        if (selectRef.current) {
          UseBootstrapSelect.getOrCreateInstance(selectRef.current);
        }

        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
          new Tooltip(tooltip);
        });
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();

    return () => {
      UseBootstrapSelect.clearAll();
      // Clean up tooltips
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        const bsTooltip = Tooltip.getInstance(tooltip);
        if (bsTooltip) {
          bsTooltip.dispose();
        }
      });
    };
  }, []);

  // Get tomorrow's date in YYYY-MM-DD format
  function getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLocations(selected);
  };

  const handleAddDate = () => {
    setDateSlots(prev => [
      ...prev,
      {
        id: Math.max(0, ...prev.map(slot => slot.id)) + 1,
        date: getTomorrowDate(),
        time: 900 // 09:00
      }
    ]);
  };

  const handleRemoveDate = (id: number) => {
    if (dateSlots.length > 1) {
      setDateSlots(prev => prev.filter(slot => slot.id !== id));
    }
  };

  // Generate time options for select (from 6:00 to 22:00)
  const getTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (const minutes of [0, 30]) {
        const time = hour * 100 + minutes;
        options.push(time);
      }
    }
    return options;
  };

  const handleDateChange = (id: number, field: keyof DateTimeSlot, value: string | number) => {
    setDateSlots(prev =>
      prev.map(slot =>
        slot.id === id
          ? {
              ...slot,
              [field]: field === 'time' ? Number(value) : value
            }
          : slot
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedLocations.length === 0) {
      setError('Please select at least one location');
      return;
    }

    if (dateSlots.length === 0) {
      setError('Please add at least one time slot');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await api.createInvitation({
        locations: selectedLocations,
        skillLevel,
        sessionDuration,
        invitationType,
        requestType,
        description: description.trim() || undefined,
        timeSlots: dateSlots.map(slot => ({
          date: new Date(slot.date),
          time: slot.time
        }))
      });

      // Show success message
      if (toastRef.current) {
        const toast = new Toast(toastRef.current);
        toast.show();
      }

      // Reset form
      setSelectedLocations([]);
      setSkillLevel(SkillLevel.Any);
      setSessionDuration(2);
      setInvitationType(ActivityType.Match);
      setRequestType(SingleDoubleType.Single);
      setDescription('');
      setDateSlots([{ 
        id: 1, 
        date: getTomorrowDate(),
        time: 900
      }]);

      // Refresh the page to show the new invitation
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <button 
        className={`btn ${isExpanded ? 'btn-outline-secondary' : 'btn-primary'} w-100`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="createInvitationForm"
      >
        {isExpanded ? (
          <>
            <i className="bi bi-x me-1"></i>
            Close
          </>
        ) : (
          <>
            <i className="bi bi-plus-lg me-1"></i>
            Create Invitation
          </>
        )}
      </button>

      <div 
        className={`collapse mt-3 ${isExpanded ? 'show' : ''}`} 
        id="createInvitationForm"
      >
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
          <div 
            ref={toastRef}
            className="toast align-items-center text-white bg-info border-0" 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">
                <i className="bi bi-info-circle me-2"></i>
                Consider adding training plan or goals to description
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto" 
                data-bs-dismiss="toast" 
                aria-label="Close"
              ></button>
            </div>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="card-title h5 mb-0">New Invitation</h3>
              <button 
                type="button"
                className="btn btn-link text-secondary p-0"
                onClick={() => setIsExpanded(false)}
                aria-label="Close form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <label className="form-label d-block">
                  Preferred Locations                  
                </label>
                <select
                  ref={selectRef}
                  className="form-select"
                  multiple
                  value={selectedLocations}
                  onChange={handleLocationChange}
                  data-searchable="true"
                  data-live-search="true"
                  data-actions-box="true"
                  data-selected-text-format="count > 2"
                  data-count-selected-text="{0} locations selected"
                  data-none-selected-text="Select locations..."
                  data-live-search-placeholder="Search locations..."
                  data-style="btn-outline-primary"
                  data-header="Select one or more locations"
                  data-max-height="300px"
                  data-position="down"
                >
                  <option value="">Select locations...</option>

                  {locations.map(location => (
                    <option 
                      key={location.id} 
                      value={location.id}
                      data-tokens={`${location.name} ${location.area}`}
                    >
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Request Type</label>
                <div className="d-flex gap-4">
                  <div className="form-check d-flex align-items-center">
                    <input
                      type="radio"
                      id="requestTypeSingle"
                      name="requestType"
                      className="form-check-input"
                      checked={requestType === SingleDoubleType.Single}
                      onChange={() => setRequestType(SingleDoubleType.Single)}
                      required
                    />
                    <label className="form-check-label ms-2" htmlFor="requestTypeSingle">
                      Single
                    </label>
                  </div>
                  <div className="form-check d-flex align-items-center opacity-50">
                    <input
                      type="radio"
                      id="requestTypeDoubles"
                      name="requestType"
                      className="form-check-input"
                      checked={requestType === SingleDoubleType.Doubles}
                      disabled
                    />
                    <label className="form-check-label ms-2" htmlFor="requestTypeDoubles">
                      Doubles
                      <span className="badge bg-secondary ms-2">Coming soon</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="skillLevel" className="form-label">Opponent Skill Level</label>
                <select 
                  className="form-select" 
                  id="skillLevel" 
                  name="skillLevel"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  required
                >
                  {Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="sessionDuration" className="form-label">Session Duration</label>
                <select
                  id="sessionDuration"
                  className="form-select"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                >
                  {SESSION_DURATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Invitation Type</label>
                <div className="d-flex gap-4">
                  <div className="form-check d-flex align-items-center">
                    <input
                      type="radio"
                      id="invitationTypeMatch"
                      name="invitationType"
                      className="form-check-input"
                      checked={invitationType === ActivityType.Match}
                      onChange={() => setInvitationType(ActivityType.Match)}
                      required
                    />
                    <label className="form-check-label ms-2" htmlFor="invitationTypeMatch">
                      Game on points
                    </label>
                    <span 
                      className="ms-2"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="Looking for a person to play a regular tennis match"
                    >
                      <i className="bi bi-info-circle text-muted"></i>
                    </span>
                  </div>
                  <div className="form-check d-flex align-items-center">
                    <input
                      type="radio"
                      id="invitationTypeTraining"
                      name="invitationType"
                      className="form-check-input"
                      checked={invitationType === ActivityType.Training}
                      onChange={() => setInvitationType(ActivityType.Training)}
                    />
                    <label className="form-check-label ms-2" htmlFor="invitationTypeTraining">
                      Training
                    </label>
                    <span 
                      className="ms-2"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="Main goal is to improve game skills by playing rallies"
                    >
                      <i className="bi bi-info-circle text-muted"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label d-flex justify-content-between align-items-center">
                  Available Time Slots
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleAddDate}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Time Slot
                  </button>
                </label>
                {dateSlots.map(slot => (
                  <div key={slot.id} className="card mb-3">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={slot.date}
                            min={getTomorrowDate()}
                            onChange={(e) => handleDateChange(slot.id, 'date', e.target.value)}
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label">Start Time</label>
                          <select
                            className="form-select"
                            value={slot.time}
                            onChange={(e) => handleDateChange(slot.id, 'time', e.target.value)}
                          >
                            {getTimeOptions().map(time => (
                              <option key={time} value={time}>
                                {numberToTime(time)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                          {dateSlots.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleRemoveDate(slot.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="form-label d-flex align-items-center">
                  Description
                  
                </label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={invitationType === ActivityType.Training ? "Describe your training plan and goals..." : "Add any additional information..."}
                />
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Invitation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvitation;