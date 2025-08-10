import React, { useState, useEffect, useRef, useCallback } from 'react';
//  Don't add 'bootstrap/dist/js/bootstrap.bundle.min.js'; here. It breaks the locations selector
import 'use-bootstrap-select/dist/use-bootstrap-select.css'
import UseBootstrapSelect from 'use-bootstrap-select'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Tooltip, Toast } from 'bootstrap';
import { components } from '../types/schema';
import { useAPI, CreateEventRequest, Location } from '../services/apiProvider';
import { formatDuration } from '../utils/dateUtils';
import AvailabilityCalendar from './event/AvailabilityCalendar';

type SkillLevel = components['schemas']['ApiEventData']['skillLevel'];
type EventType = components['schemas']['ApiEventData']['eventType'];
type SingleDoubleType = 'SINGLE' | 'DOUBLES';

const MATCH_DURATION_OPTIONS = [
  { value: '1', label: formatDuration(60) },
  { value: '1.5', label: formatDuration(90) },
  { value: '2', label: formatDuration(120) },
  { value: '2.5', label: formatDuration(150) },
  { value: '3', label: formatDuration(180) },
  { value: '3.5', label: formatDuration(210) },
  { value: '4', label: formatDuration(240) },
];

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  'INTERMEDIATE': 'NTRP 3.5–5.0',
  'BEGINNER': 'NTRP < 3.5',
  'ADVANCED': 'NTRP > 5.0',
  'ANY': 'Any NTRP'
};

// Time slot validation utilities
const validateTimeSlots = (selectedTimes: string[]): boolean => {
  if (selectedTimes.length === 0) return false;
  
  // Validate each selected time is in the future
  const now = new Date();
  return selectedTimes.every(timeStr => {
    const time = new Date(timeStr);
    return time.getTime() > now.getTime();
  });
};

const CreateEvent: React.FC<{ onEventCreated?: () => void }> = ({ onEventCreated }) => {
  const api = useAPI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState('2');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('INTERMEDIATE');
  const [selectedStartTimes, setSelectedStartTimes] = useState<string[]>([]);
  const [nightGame, setNightGame] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Clear validation errors when user makes changes
  const handleTimeSelectionChange = useCallback((times: string[]) => {
    setSelectedStartTimes(times);
    if (validationErrors.some(error => error.includes('time slot'))) {
      setValidationErrors(prev => prev.filter(error => !error.includes('time slot')));
    }
  }, [validationErrors]);

  const selectRef = useRef<HTMLSelectElement>(null);
  
  const [invitationType, setInvitationType] = useState<EventType>('MATCH');
  const [description, setDescription] = useState('');
  const toastRef = useRef<HTMLDivElement>(null);
  const [requestType, setRequestType] = useState<SingleDoubleType>('SINGLE');

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      setLocationError(null);
      try {
        const response = await api.listLocations();
        if (Array.isArray(response) && response.length > 0) {
          setLocations(response);
        } else {
          setLocationError('No locations available');
        }
      } catch {
        setLocationError('Failed to load locations. Please try again later.');
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [api]);

  // Initialize bootstrap-select and tooltips
  useEffect(() => {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
      if (tooltip instanceof HTMLElement) {
        new Tooltip(tooltip);
      }
    });

    // Only initialize select if component is expanded and locations are loaded
    if (isExpanded && locations.length > 0 && !isLoadingLocations && selectRef.current) {
      // Clean up existing instance and create a new one
      if (typeof UseBootstrapSelect.clearAll === 'function') {
        UseBootstrapSelect.clearAll();
      }
      if (typeof UseBootstrapSelect.getOrCreateInstance === 'function') {
        const select = UseBootstrapSelect.getOrCreateInstance(selectRef.current);
        // Ensure the select is initialized with the current selected values
        select.setValue(selectedLocations);
        // Add change event listener to update React state
        selectRef.current.addEventListener('change', handleNativeLocationChange);
      }
    }

    return () => {
      // Clean up tooltips
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        if (tooltip instanceof HTMLElement) {
          const bsTooltip = Tooltip.getInstance(tooltip);
          if (bsTooltip) {
            bsTooltip.dispose();
          }
        }
      });
      
      // Clean up bootstrap-select and event listeners
      if (selectRef.current) {
        selectRef.current.removeEventListener('change', handleNativeLocationChange);
      }
      if (typeof UseBootstrapSelect.clearAll === 'function') {
        UseBootstrapSelect.clearAll();
      }
    };
  }, [isExpanded, locations, isLoadingLocations, selectedLocations]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (selectedLocations.length === 0) {
      errors.push('Please select at least one location');
    }
    
    if (!validateTimeSlots(selectedStartTimes)) {
      if (selectedStartTimes.length === 0) {
        errors.push('Please select at least one time slot');
      } else {
        errors.push('Some selected times are in the past');
      }
    }
    
    if (description.trim().length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setSelectedLocations([]);
    setSelectedStartTimes([]);
    setNightGame(false);
    setSessionDuration('2');
    setSkillLevel('INTERMEDIATE');
    setInvitationType('MATCH');
    setRequestType('SINGLE');
    setDescription('');
    setValidationErrors([]);
  }, []);

  const handleNativeLocationChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    if (select) {
      const selected = Array.from(select.selectedOptions, option => option.value);
      setSelectedLocations(selected);
    }
  };

  const handleReactLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLocations(selected);
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Calendar selection handlers - now fully controlled by parent component

  const showToast = (message: string) => {
    if (toastRef.current) {
      const toastElement = toastRef.current;
      const toastBody = toastElement.querySelector('.toast-body');
      if (toastBody) {
        toastBody.textContent = message;
      }
      const toast = new Toast(toastElement, {
        autohide: true,
        delay: 3000
      });
      toast.show();
    }
  };

  const renderLocationSelect = () => {
    if (isLoadingLocations) {
      return (
        <div className="p-3 text-center bg-light border rounded">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading locations...</span>
          </div>
          <p className="mt-2 mb-0">Loading available locations...</p>
        </div>
      );
    }

    if (locationError) {
      return (
        <div className="p-3 text-center bg-light border rounded">
          <p className="text-danger mb-0">{locationError}</p>
        </div>
      );
    }

    return (
      <select
        ref={selectRef}
        className="form-select"
        multiple
        value={selectedLocations}
        onChange={handleReactLocationChange}
        data-live-search="true"
        title="Select locations"
      >
        {locations.map(location => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      const errorMessage = validationErrors.join('. ');
      showToast(errorMessage);
      return;
    }

    try {
      // Use selected times directly - they're already in ISO format
      const request: CreateEventRequest = {
        event: {
          eventType: invitationType,
          description: description.trim() || undefined,
          expectedPlayers: requestType === 'SINGLE' ? 2 : 4,
          sessionDuration: parseFloat(sessionDuration) * 60, // Convert hours to minutes
          skillLevel,
          visibility: 'PUBLIC',
          locations: selectedLocations,
          timeSlots: selectedStartTimes,
        }
      };

      await api.createEvent(request);
      showToast('Event created successfully!');
      
      // Reset form to initial state
      resetForm();
      setIsExpanded(false);
      onEventCreated?.();
    } catch (error) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error 
        ? `Error creating event: ${error.message}` 
        : 'Error creating event. Please try again.';
      showToast(errorMessage);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSessionDuration(e.target.value);
  };

  const handleSkillLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSkillLevel(e.target.value as SkillLevel);
  };

  const handleInvitationTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value as EventType;
    setInvitationType(type);
    if (type === 'TRAINING' && toastRef.current) {
      const toast = new Toast(toastRef.current);
      toast.show();
    }
  };

  const handleRequestTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequestType(e.target.value as SingleDoubleType);
  };

  return (
    <div className="mb-4">
      <button 
        className={`btn ${isExpanded ? 'btn-outline-secondary' : 'btn-primary'} w-100`}
        onClick={handleExpandToggle}
        aria-expanded={isExpanded}
        aria-controls="CreateEventForm"
      >
        {isExpanded ? (
          <>
            <i className="bi bi-x me-1"></i>
            Close
          </>
        ) : (
          <>
            <i className="bi bi-plus-lg me-1"></i>
            Create Event
          </>
        )}
      </button>

      <div 
        className={`collapse mt-3 ${isExpanded ? 'show' : ''}`} 
        id="CreateEventForm"
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
            <form onSubmit={handleCreateEvent}>
              <div className="mb-4">
                <label className="form-label d-block">
                  Preferred Locations                  
                </label>
                {renderLocationSelect()}
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
                      checked={requestType === 'SINGLE'}
                      onChange={handleRequestTypeChange}
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
                      checked={requestType === 'DOUBLES'}
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
                  onChange={handleSkillLevelChange}
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
                  className="form-select" 
                  id="sessionDuration" 
                  name="sessionDuration"
                  value={sessionDuration}
                  onChange={handleDurationChange}
                  required
                >
                  {MATCH_DURATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Invitation Type</label>
                <div className="d-flex gap-4" role="radiogroup" aria-label="Invitation Type">
                  <div className="form-check d-flex align-items-center">
                    <input
                      type="radio"
                      id="invitationTypeMatch"
                      name="invitationType"
                      className="form-check-input"
                      value="MATCH"
                      checked={invitationType === 'MATCH'}
                      onChange={handleInvitationTypeChange}
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
                      value="TRAINING"
                      checked={invitationType === 'TRAINING'}
                      onChange={handleInvitationTypeChange}
                      required
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

              <div className="mb-3">
                <label className="form-label">Your Availability (next 7 days)</label>
                {validationErrors.some(error => error.includes('time slot')) && (
                  <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                    <small><i className="bi bi-exclamation-triangle me-1"></i>
                    {validationErrors.find(error => error.includes('time slot'))}</small>
                  </div>
                )}
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="nightGameSwitch"
                    checked={nightGame}
                    onChange={(e) => setNightGame(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="nightGameSwitch">
                    Night game (show only night hours)
                  </label>
                </div>
                <AvailabilityCalendar
                  value={selectedStartTimes}
                  onChange={handleTimeSelectionChange}
                  startHour={8}
                  endHour={21}
                  nightOnly={nightGame}
                  disabled={!isExpanded}
                  className={`border rounded p-2 ${validationErrors.some(error => error.includes('time slot')) ? 'border-danger' : ''}`}
                />
                {selectedStartTimes.length > 0 && (
                  <small className="form-text text-muted mt-1 d-block">
                    {selectedStartTimes.length} time slot{selectedStartTimes.length !== 1 ? 's' : ''} selected
                  </small>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="form-label d-flex align-items-center">
                  Description (optional)
                  
                </label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={invitationType === 'TRAINING' ? "Describe your training plan and goals..." : "Add any additional information..."}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Create Invitation
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;