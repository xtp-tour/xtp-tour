import React, { useState } from 'react';
import { EventStep } from '../types/eventTypes';
import './EventFlowDiagram.css';

interface Props {
  currentStep: EventStep;
  hostName: string;
  className?: string;
  defaultExpanded?: boolean;
}

export const EventFlowDiagram: React.FC<Props> = ({
  currentStep,
  hostName,
  className = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const steps = [
    {
      step: EventStep.Created,
      title: 'Event Created',
      description: `${hostName} created an event to play`,
      icon: 'bi-plus-circle'
    },
    {
      step: EventStep.Pending,
      title: 'Ready for Your Response',
      description: 'Review and choose your preferred time and place',
      icon: 'bi-clock'
    },
    {
      step: EventStep.Joined,
      title: 'Your Response Sent',
      description: `You've selected your preferences and joined the event`,
      icon: 'bi-check-circle'
    },
    {
      step: EventStep.Confirmed,
      title: 'Session Scheduled',
      description: `${hostName} has booked the court and confirmed the session`,
      icon: 'bi-calendar-check'
    }
  ];

  const getStepStatus = (step: EventStep) => {
    const stepOrder = {
      [EventStep.Created]: 0,
      [EventStep.Pending]: 1,
      [EventStep.Joined]: 2,
      [EventStep.Confirmed]: 3,
      [EventStep.Rejected]: -1
    };

    const currentStepOrder = stepOrder[currentStep];
    const thisStepOrder = stepOrder[step];

    if (currentStep === EventStep.Rejected) {
      return 'rejected';
    }

    if (thisStepOrder < currentStepOrder) {
      return 'completed';
    }
    if (thisStepOrder === currentStepOrder) {
      return 'current';
    }
    return 'pending';
  };

  return (
    <div className={`event-flow ${className}`}>
      <div
        className="flow-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
      >
        <h6 className="mb-0">
          <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
          How it works
        </h6>
      </div>

      {isExpanded && (
        <div className="flow-content mt-3">
          <div className="flow-steps mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                <div className={`flow-step ${getStepStatus(step.step)}`}>
                  <div className="step-icon">
                    <i className={`bi ${step.icon}`}></i>
                  </div>
                  <div className="step-content">
                    <h6 className="step-title">{step.title}</h6>
                    <p className="step-description">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flow-connector ${getStepStatus(step.step)}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="next-steps">
            <h6 className="next-steps-title">
              <i className="bi bi-info-circle me-2"></i>
              What happens after you join?
            </h6>
            <ol className="next-steps-list">
              <li>{hostName} will be notified of your preferred options</li>
              <li>They will book a court based on your availability</li>
              <li>You'll receive a confirmation with the final time and place</li>
            </ol>
          </div>

          {currentStep === EventStep.Rejected && (
            <div className="rejection-overlay">
              <div className="rejection-content">
                <i className="bi bi-x-circle text-danger"></i>
                <h6>Event Rejected</h6>
                <p>This event is no longer available</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};