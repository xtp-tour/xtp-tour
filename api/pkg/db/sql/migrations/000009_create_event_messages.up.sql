CREATE TABLE IF NOT EXISTS event_messages (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    parent_message_id VARCHAR(36) NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES event_messages(id) ON DELETE SET NULL,
    INDEX idx_event_messages_event_created (event_id, created_at),
    INDEX idx_event_messages_parent (parent_message_id)
);
