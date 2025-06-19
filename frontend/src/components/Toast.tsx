import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  show, 
  onHide, 
  type = 'success', 
  duration = 3000 
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  if (!show) return null;

  const getToastClass = () => {
    switch (type) {
      case 'error':
        return 'bg-danger text-white';
      case 'info':
        return 'bg-info text-white';
      default:
        return 'bg-success text-white';
    }
  };

  return (
    <div 
      className={`toast show position-fixed top-0 end-0 m-3 ${getToastClass()}`}
      style={{ zIndex: 9999 }}
    >
      <div className="toast-body d-flex align-items-center">
        <i className={`bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2`}></i>
        {message}
        <button 
          type="button" 
          className="btn-close btn-close-white ms-auto" 
          onClick={onHide}
        ></button>
      </div>
    </div>
  );
};

export default Toast; 