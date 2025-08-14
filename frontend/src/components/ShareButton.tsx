import React from 'react';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  onClick,
  title,
  className = "",
  disabled = false
}) => {
  const { t } = useTranslation();
  const defaultTitle = title || t('share.title');
  return (
    <button
      className={`btn btn-sm btn-outline-secondary ${className}`}
      onClick={onClick}
      title={defaultTitle}
      aria-label={title}
      disabled={disabled}
      style={{ minHeight: '32px', minWidth: '32px' }}
    >
      <i className="bi bi-share"></i>
    </button>
  );
};

export default ShareButton;