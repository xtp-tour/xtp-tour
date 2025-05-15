import React from 'react';
import { components } from '../../types/schema';

type ApiJoinRequest = components['schemas']['ApiJoinRequest'];

interface JoinedUsersProps {
  joinRequests: ApiJoinRequest[];
}

const JoinedUsers: React.FC<JoinedUsersProps> = ({ joinRequests }) => {
  const joinedUsers = joinRequests.filter(
    request => request.isRejected === false
  );

  if (joinedUsers.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">Joined Players</h3>
      <ul className="mt-2 space-y-2">
        {joinedUsers.map(user => (
          <li key={user.id} className="flex items-center">
            <span className="text-gray-700">{user.userId}</span>
            {user.comment && (
              <span className="ml-2 text-sm text-gray-500">
                <i className="bi bi-chat-dots mr-1"></i>
                {user.comment}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JoinedUsers; 