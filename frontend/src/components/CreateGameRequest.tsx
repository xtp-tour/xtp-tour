import React, { useState, useEffect, useRef } from 'react';
import 'use-bootstrap-select/dist/use-bootstrap-select.css'
import UseBootstrapSelect from 'use-bootstrap-select'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { DateTimeSlot, Location, SkillLevel, SKILL_LEVEL_LABELS } from '../types/game';

const MATCH_DURATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '1.5', label: '1½ hours' },
  { value: '2', label: '2 hours' },
  { value: '2.5', label: '2½ hours' },
  { value: '3', label: '3 hours' },
  { value: '3.5', label: '3½ hours' },
  { value: '4', label: '4 hours' },
];

// Mock locations data
const MOCK_LOCATIONS: Location[] = [
  // Central Area
  { id: 'central_park', name: 'Central Park Tennis Courts', area: 'Central' },
  { id: 'public_courts', name: 'Public Tennis Courts', area: 'Central' },
  { id: 'city_sports', name: 'City Sports Complex', area: 'Central' },
  
  // West Area
  { id: 'riverside', name: 'Riverside Tennis Center', area: 'West' },
  { id: 'sports_center', name: 'Sports Center Courts', area: 'West' },
  { id: 'west_park', name: 'West Park Tennis Club', area: 'West' },
  
  // East Area
  { id: 'east_side', name: 'East Side Tennis Club', area: 'East' },
  { id: 'community', name: 'Community Tennis Park', area: 'East' },
  { id: 'east_academy', name: 'Eastern Tennis Academy', area: 'East' },
  
  // North Area
  { id: 'north_courts', name: 'Northern Tennis Academy', area: 'North' },
  { id: 'north_park', name: 'North Park Courts', area: 'North' },
  
  // South Area
  { id: 'downtown', name: 'Downtown Tennis Complex', area: 'South' },
  { id: 'south_center', name: 'South Center Courts', area: 'South' }
];

// Mock API call function
const mockFetchLocations = async (): Promise<Location[]> => {
  // Simulate network delay between 500ms and 1500ms
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate API failure 10% of the time
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch locations');
  }

  return MOCK_LOCATIONS;
};

const CreateGameRequest: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [matchDuration, setMatchDuration] = useState('2'); // Default to 2 hours
  const [skillLevel, setSkillLevel] = useState<SkillLevel | ''>('');
  const [dateSlots, setDateSlots] = useState<DateTimeSlot[]>([
    { 
      id: 1, 
      date: getTomorrowDate(),
      timeFrom: '09:00',
      timeTo: '10:00'
    }
  ]);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      setLocationError(null);
      try {
        const data = await mockFetchLocations();
        setLocations(data);

        // Initialize bootstrap-select after locations are loaded
        if (selectRef.current) {
          UseBootstrapSelect.getOrCreateInstance(selectRef.current);
        }
      } catch (error) {
        setLocationError('Failed to load locations. Please try again later.');
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();

    return () => {
      UseBootstrapSelect.clearAll();
    };
  }, []);

  // Get tomorrow's date in YYYY-MM-DD format
  function getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Format time to ensure only full and half hours
  function formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 30) * 30;
    const adjustedHours = hours + Math.floor(roundedMinutes / 60);
    const finalMinutes = roundedMinutes % 60;
    
    return `${String(adjustedHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
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
        timeFrom: '09:00',
        timeTo: '10:00'
      }
    ]);
  };

  const handleRemoveDate = (id: number) => {
    if (dateSlots.length > 1) {
      setDateSlots(prev => prev.filter(slot => slot.id !== id));
    }
  };

  const handleDateChange = (id: number, field: keyof DateTimeSlot, value: string) => {
    if (field === 'timeFrom' || field === 'timeTo') {
      value = formatTime(value);
    }
    
    setDateSlots(prev =>
      prev.map(slot =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  // Generate time options for select (from 6:00 to 22:00)
  const getTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      options.push(`${String(hour).padStart(2, '0')}:00`);
      options.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return options;
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

    // Group locations by area
    const groupedLocations = locations.reduce((acc, location) => {
      if (!acc[location.area]) {
        acc[location.area] = [];
      }
      acc[location.area].push(location);
      return acc;
    }, {} as Record<string, Location[]>);

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
        {Object.entries(groupedLocations).map(([area, areaLocations]) => (
          <optgroup key={area} label={`${area} Area`}>
            {areaLocations.map(location => (
              <option 
                key={location.id} 
                value={location.id}
                data-tokens={`${location.name} ${area}`}
              >
                {location.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      locations: selectedLocations,
      skillLevel,
      matchDuration: parseFloat(matchDuration),
      dates: dateSlots.map(slot => ({
        date: slot.date,
        timespan: {
          from: parseInt(slot.timeFrom.replace(':', '')),
          to: parseInt(slot.timeTo.replace(':', ''))
        }
      }))
    };

    try {
      // Mock API call - replace with actual API endpoint when ready
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to create game request');
      }

      // Handle successful creation
      console.log('Game request created successfully', requestData);
      setIsExpanded(false); // Collapse the form after successful submission
      setSelectedLocations([]); // Reset locations
      setDateSlots([{ 
        id: 1, 
        date: getTomorrowDate(),
        timeFrom: '09:00',
        timeTo: '10:00'
      }]); // Reset form
    } catch (error) {
      console.error('Error creating game request:', error);
    }
  };

  return (
    <div className="mb-4">
      <button 
        className={`btn ${isExpanded ? 'btn-outline-secondary' : 'btn-primary'} w-100`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="createGameForm"
      >
        {isExpanded ? (
          <>
            <i className="bi bi-x me-1"></i>
            Close
          </>
        ) : (
          <>
            <i className="bi bi-plus-lg me-1"></i>
            Create Game Request
          </>
        )}
      </button>

      <div 
        className={`collapse mt-3 ${isExpanded ? 'show' : ''}`} 
        id="createGameForm"
      >
        <div className="card shadow">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="card-title h5 mb-0">New Game Request</h3>
              <button 
                type="button"
                className="btn btn-link text-secondary p-0"
                onClick={() => setIsExpanded(false)}
                aria-label="Close form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="mb-4">
                <label className="form-label d-block">
                  Preferred Locations                  
                </label>
                {renderLocationSelect()}
              </div>

              <div className="mb-3">
                <label htmlFor="skillLevel" className="form-label">Skill Level</label>
                <select 
                  className="form-select" 
                  id="skillLevel" 
                  name="skillLevel"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  required
                >
                  <option value="">Select your skill level</option>
                  {Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="matchDuration" className="form-label">Match Duration</label>
                <select 
                  className="form-select" 
                  id="matchDuration" 
                  name="matchDuration"
                  value={matchDuration}
                  onChange={(e) => setMatchDuration(e.target.value)}
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
                            {timeOptions.map(option => (
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

              <button type="submit" className="btn btn-primary w-100">
                Create Game Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGameRequest;