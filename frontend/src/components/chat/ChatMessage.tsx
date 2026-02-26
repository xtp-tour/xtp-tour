import React, { useState, useEffect } from 'react';
import { EventMessage, ApiUserProfileData } from '../../types/api';
import { useAPI } from '../../services/apiProvider';
import { useTranslation } from 'react-i18next';

interface ChatMessageProps {
  message: EventMessage;
  onReply?: (message: EventMessage) => void;
  isReply?: boolean;
  isOwnMessage?: boolean;
}

const getInitials = (profile: ApiUserProfileData | null): string | null => {
  if (!profile) return null;
  const first = (profile.firstName || '').trim();
  const last = (profile.lastName || '').trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (last) return last[0].toUpperCase();
  return null;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onReply, isReply = false, isOwnMessage = false }) => {
  const { t } = useTranslation();
  const api = useAPI();
  const [profile, setProfile] = useState<ApiUserProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getUserProfileByUserId(message.userId);
        setProfile(response.profile || null);
      } catch {
        // Silently ignore - will show fallback
      }
    };
    fetchProfile();
  }, [message.userId, api]);

  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || message.userId
    : message.userId;

  const initials = getInitials(profile);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const messageClasses = [
    'd-flex gap-2 mb-2',
    isReply ? 'chat-message--reply' : '',
    isOwnMessage ? 'chat-message--own' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={messageClasses}>
      <div className="chat-avatar-circle">
        {initials || <i className="bi bi-person-fill"></i>}
      </div>
      <div className="flex-grow-1 min-width-0">
        <div className="d-flex align-items-baseline gap-2 mb-1">
          <span className="chat-message-author">{displayName}</span>
          <span className="chat-message-time">{formatTime(message.createdAt)}</span>
        </div>
        <div className="chat-bubble">
          {message.messageText}
        </div>
        {!isReply && onReply && (
          <div className="mt-1">
            <button
              className="chat-reply-btn"
              onClick={() => onReply(message)}
            >
              <i className="bi bi-reply"></i>
              {t('chat.reply')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
