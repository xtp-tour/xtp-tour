import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAPI } from '../../services/apiProvider';
import { EventMessage } from '../../types/api';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import ChatMessage from './ChatMessage';

interface EventChatProps {
  eventId: string;
  collapsible?: boolean;
  embedded?: boolean;
}

const POLL_INTERVAL_MS = 5000;

const EventChat: React.FC<EventChatProps> = ({ eventId, collapsible = false, embedded = false }) => {
  const { t } = useTranslation();
  const api = useAPI();
  const { isSignedIn, user } = useUser();
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<EventMessage | null>(null);
  const [isOpen, setIsOpen] = useState(!collapsible);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const loadMessages = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const afterId = isPolling ? lastMessageIdRef.current : undefined;
      const fetched = await api.getEventMessages(eventId, 50, afterId || undefined);

      if (isPolling && fetched.length > 0) {
        setMessages(prev => [...prev, ...fetched]);
      } else if (!isPolling) {
        setMessages(fetched);
      }

      if (fetched.length > 0) {
        lastMessageIdRef.current = fetched[fetched.length - 1].id;
      }

      setError(null);
    } catch {
      if (!isPolling) setError(t('chat.loadError'));
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [eventId, api, t]);

  // Initial load
  useEffect(() => {
    loadMessages(false);
  }, [loadMessages]);

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const parentId = replyingTo?.id;
      const sentMessage = await api.sendEventMessage(eventId, text, parentId);
      setMessages(prev => [...prev, sentMessage]);
      lastMessageIdRef.current = sentMessage.id;
      setNewMessage('');
      setReplyingTo(null);
    } catch {
      setError(t('chat.sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages: top-level messages and their replies
  const topLevelMessages = messages.filter(m => !m.parentMessageId);
  const repliesByParent = messages.reduce<Record<string, EventMessage[]>>((acc, m) => {
    if (m.parentMessageId) {
      if (!acc[m.parentMessageId]) acc[m.parentMessageId] = [];
      acc[m.parentMessageId].push(m);
    }
    return acc;
  }, {});

  const header = (
    <div className="d-flex align-items-center gap-2">
      <i className="bi bi-chat-dots" style={{ color: 'var(--tennis-navy)' }}></i>
      <span style={{ color: 'var(--tennis-navy)', fontWeight: 600 }}>{t('chat.title')}</span>
      {messages.length > 0 && (
        <span
          className="badge rounded-pill"
          style={{ background: 'var(--navy-tint)', color: 'var(--tennis-navy)', fontSize: '0.7rem' }}
        >
          {messages.length}
        </span>
      )}
    </div>
  );

  const messagesArea = (
    <div className={collapsible ? 'chat-messages--compact' : 'chat-messages'}>
      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger py-2 mb-2" role="alert">
          <small>{error}</small>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="chat-empty-state">
          <i className="bi bi-chat-square-text d-block"></i>
          <div className="text-muted mb-1">
            <small>{t('chat.noMessages')}</small>
          </div>
          <div className="text-muted">
            <small style={{ fontSize: '0.8rem' }}>{t('chat.emptyStateHint')}</small>
          </div>
        </div>
      )}

      {!loading && topLevelMessages.map(message => (
        <div key={message.id}>
          <ChatMessage
            message={message}
            onReply={isSignedIn ? (msg) => setReplyingTo(msg) : undefined}
            isOwnMessage={message.userId === user?.id}
          />
          {repliesByParent[message.id]?.map(reply => (
            <ChatMessage
              key={reply.id}
              message={reply}
              isReply
              isOwnMessage={reply.userId === user?.id}
            />
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  const composer = isSignedIn ? (
    <div className="chat-composer">
      {replyingTo && (
        <div className="chat-reply-indicator">
          <i className="bi bi-reply" style={{ color: 'var(--tennis-navy)' }}></i>
          <span className="text-muted flex-grow-1">
            {t('chat.replyingTo', { user: replyingTo.userId })}
          </span>
          <button
            className="chat-reply-btn"
            onClick={() => setReplyingTo(null)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}
      <div className="d-flex gap-2 align-items-center">
        <input
          type="text"
          className="form-control chat-input"
          placeholder={t('chat.typeMessage')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          maxLength={1000}
        />
        <button
          className="btn btn-primary chat-send-btn"
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <i className="bi bi-send"></i>
          )}
        </button>
      </div>
    </div>
  ) : (
    <div className="chat-signin-prompt">
      <i className="bi bi-lock me-1"></i>
      {t('chat.signInToChat')}
    </div>
  );

  const chatBody = (
    <>
      {messagesArea}
      {composer}
    </>
  );

  // Collapsible mode: toggle bar + expandable body
  if (collapsible) {
    if (embedded) {
      return (
        <>
          <button
            className="chat-toggle-bar"
            onClick={() => setIsOpen(!isOpen)}
          >
            {header}
            <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-auto`}></i>
          </button>
          {isOpen && chatBody}
        </>
      );
    }

    return (
      <div className="card shadow-sm border-0 mt-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <button
          className="chat-toggle-bar"
          style={{ borderTop: 'none' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {header}
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-auto`}></i>
        </button>
        {isOpen && chatBody}
      </div>
    );
  }

  // Embedded non-collapsible: just content, no card wrapper
  if (embedded) {
    return (
      <>
        <div className="border-top" style={{ padding: '0.75rem 1rem' }}>
          {header}
        </div>
        {chatBody}
      </>
    );
  }

  // Default: standalone card (e.g., PublicEventPage)
  return (
    <div className="card shadow-sm border-0 mt-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      <div className="card-header bg-white border-bottom" style={{ borderRadius: '12px 12px 0 0' }}>
        <h6 className="mb-0">{header}</h6>
      </div>
      {chatBody}
    </div>
  );
};

export default EventChat;
