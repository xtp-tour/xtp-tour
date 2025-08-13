import React from 'react';

interface ShareButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  onClick,
  title = "Share event",
  className = "",
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-sm btn-outline-secondary ${className}`}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{ minHeight: '32px', minWidth: '32px' }}
    >
      <i className="bi bi-share"></i>
    </button>
  );
};

export default ShareButton;