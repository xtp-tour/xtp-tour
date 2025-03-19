import React, { useState, useEffect, useRef } from 'react';
//  Don't add 'bootstrap/dist/js/bootstrap.bundle.min.js'; here. It breaks the locations selector
import 'use-bootstrap-select/dist/use-bootstrap-select.css'
import UseBootstrapSelect from 'use-bootstrap-select'


import 'bootstrap-icons/font/bootstrap-icons.css';
import { Tooltip, Toast } from 'bootstrap';
import { EventType, SingleDoubleType, SkillLevel, SessionTimeSlot, Event, EventStatus } from '../types/event';
import { useAPI } from '../services/apiProvider';
import { Location } from '../types/locations';

interface DateTimeSlot {
  id: number;
  date: string;
  timeFrom: string;
  timeTo: string;
}

const MATCH_DURATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '1.5', label: '1½ hours' },
  { value: '2', label: '2 hours' },
  { value: '2.5', label: '2½ hours' },
  { value: '3', label: '3 hours' },
  { value: '3.5', label: '3½ hours' },
  { value: '4', label: '4 hours' },
];

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  [SkillLevel.Any]: 'Any NTRP',
  [SkillLevel.Beginner]: 'NTRP < 3.5',
  [SkillLevel.Intermediate]: 'NTRP 3.5–5.0',
  [SkillLevel.Advanced]: 'NTRP > 5.0'
};

const calculateEndTime = (startTime: string, duration: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const durationHours = parseFloat(duration);
  
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

const CreateInvitation: React.FC = () => {
  const api = useAPI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState('2'); // Default to 2 hours
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.Any);
  const [dateSlots, setDateSlots] = useState<DateTimeSlot[]>([
    { 
      id: 1, 
      date: getTomorrowDate(),
      timeFrom: '09:00',
      timeTo: calculateEndTime('09:00', '2') // Default to 2 hours from 9:00
    }
  ]);
  const selectRef = useRef<HTMLSelectElement>(null);
  
  const [invitationType, setInvitationType] = useState<EventType>(EventType.Match);
  const [description, setDescription] = useState('');
  const toastRef = useRef<HTMLDivElement>(null);
  const [requestType, setRequestType] = useState<SingleDoubleType>(SingleDoubleType.Single);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      setLocationError(null);
      try {
        const response = await api.listLocations();
        setLocations(response.locations);
      } catch (error) {
        setLocationError('Failed to load locations. Please try again later.');
        console.error('Error fetching locations:', error);
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
      new Tooltip(tooltip);
    });

    // Only initialize select if component is expanded and locations are loaded
    if (isExpanded && locations.length > 0 && !isLoadingLocations && selectRef.current) {
      // Clean up existing instance and create a new one
      UseBootstrapSelect.clearAll();
      UseBootstrapSelect.getOrCreateInstance(selectRef.current);
    }

    return () => {
      // Clean up tooltips
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        const bsTooltip = Tooltip.getInstance(tooltip);
        if (bsTooltip) {
          bsTooltip.dispose();
        }
      });
      
      // Clean up bootstrap-select
      UseBootstrapSelect.clearAll();
    };
  }, [isExpanded, locations, isLoadingLocations]);

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

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddDate = () => {
    const defaultStartTime = '09:00';
    setDateSlots(prev => [
      ...prev,
      {
        id: Math.max(0, ...prev.map(slot => slot.id)) + 1,
        date: getTomorrowDate(),
        timeFrom: defaultStartTime,
        timeTo: calculateEndTime(defaultStartTime, sessionDuration) // Use current session duration
      }
    ]);
  };

  const handleRemoveDate = (id: number) => {
    if (dateSlots.length > 1) {
      setDateSlots(prev => prev.filter(slot => slot.id !== id));
    }
  };

  // Generate time options for select (from 6:00 to 22:00)
  const getTimeOptions = (startTime?: string) => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (const minutes of ['00', '30']) {
        const time = `${String(hour).padStart(2, '0')}:${minutes}`;
        if (!startTime || time > startTime) {
          options.push(time);
        }
      }
    }
    return options;
  };

  const handleDateChange = (id: number, field: keyof DateTimeSlot, value: string) => {
    if (field === 'timeFrom') {
      const endTime = calculateEndTime(value, sessionDuration);
      setDateSlots(prev =>
        prev.map(slot =>
          slot.id === id ? { ...slot, timeFrom: value, timeTo: endTime } : slot
        )
      );
    } else {
      setDateSlots(prev =>
        prev.map(slot =>
          slot.id === id ? { ...slot, [field]: value } : slot
        )
      );
    }
  };

  const timeOptions = getTimeOptions();

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
        <div className="alert alert-danger" role="alert">
          {locationError}
          <button 
            type="button" 
            className="btn btn-link"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      );
    }

    if (locations.length === 0) {
      return (
        <div className="alert alert-info" role="alert">
          No locations available at the moment.
        </div>
      );
    }

    return (
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
    );
  };


  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert date slots to SessionTimeSlot format
    const timeSlots: SessionTimeSlot[] = dateSlots.map(slot => ({
      date: new Date(slot.date),
      time: parseInt(slot.timeFrom.replace(':', ''))
    }));

    const requestData: Event = {
      id: '', // Will be assigned by the server
      ownerId: '', // Will be assigned by the server
      locations: selectedLocations,
      skillLevel,
      sessionDuration: parseFloat(sessionDuration),
      invitationType,
      expectedPlayers: requestType === SingleDoubleType.Doubles ? 4 : 2,
      description,
      timeSlots,
      status: EventStatus.Open,
      createdAt: new Date(),
      joinRequests: []
    };

    try {
      await api.createEvent(requestData);

      // Reset form after successful submission
      setIsExpanded(false);
      setSelectedLocations([]);
      setDateSlots([{ 
        id: 1, 
        date: getTomorrowDate(),
        timeFrom: '09:00',
        timeTo: calculateEndTime('09:00', '2')
      }]);
    } catch (error) {
      console.error('Error creating invitation:', error);
      // TODO: Add error handling with toast notifications
    }
  };

  const handleInvitationTypeChange = (type: EventType) => {
    setInvitationType(type);
    if (type === EventType.Training && toastRef.current) {
      const toast = new Toast(toastRef.current);
      toast.show();
    }
  };

  return (
    <div className="mb-4">
      <button 
        className={`btn ${isExpanded ? 'btn-outline-secondary' : 'btn-primary'} w-100`}
        onClick={handleExpandToggle}
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
            <form onSubmit={handleCreateInvitation}>
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
                  className="form-select" 
                  id="sessionDuration" 
                  name="sessionDuration"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
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
                <div className="d-flex gap-4">
                  <div className="form-check d-flex align-items-center">
                    <input
                      type="radio"
                      id="invitationTypeMatch"
                      name="invitationType"
                      className="form-check-input"
                      checked={invitationType === EventType.Match}
                      onChange={() => handleInvitationTypeChange(EventType.Match)}
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
                      checked={invitationType === EventType.Training}
                      onChange={() => handleInvitationTypeChange(EventType.Training)}
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
                <label className="form-label">Available Dates</label>
                {dateSlots.map(slot => (
                  <div key={slot.id} className="card p-3 bg-light mb-2">
                    <div className="row g-5">
                      <div className="col-md-5">
                        <div className="d-md-flex align-items-center">
                          <label htmlFor={`date-${slot.id}`} className="form-label mb-md-0 me-md-2">
                            Date
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            id={`date-${slot.id}`}
                            value={slot.date}
                            min={getTomorrowDate()}
                            onChange={(e) => handleDateChange(slot.id, 'date', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-md-flex align-items-center">
                          <label htmlFor={`timeFrom-${slot.id}`} className="form-label mb-md-0 me-md-2">
                            From
                          </label>
                          <select 
                            className="form-select" 
                            id={`timeFrom-${slot.id}`}
                            value={slot.timeFrom}
                            onChange={(e) => handleDateChange(slot.id, 'timeFrom', e.target.value)}
                            required
                          >
                            {timeOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-md-flex align-items-center">
                          <label htmlFor={`timeTo-${slot.id}`} className="form-label mb-md-0 me-md-2">
                            To
                          </label>
                          <select 
                            className="form-select" 
                            id={`timeTo-${slot.id}`}
                            value={slot.timeTo}
                            onChange={(e) => handleDateChange(slot.id, 'timeTo', e.target.value)}
                            required
                          >
                            {getTimeOptions(slot.timeFrom).map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {dateSlots.length > 1 && (
                        <div className="col-md-1 d-flex align-items-center">
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary w-100"
                            onClick={() => handleRemoveDate(slot.id)}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={handleAddDate}
                >
                  + Add Another Date
                </button>
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
                  placeholder={invitationType === EventType.Training ? "Describe your training plan and goals..." : "Add any additional information..."}
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

export default CreateInvitation;