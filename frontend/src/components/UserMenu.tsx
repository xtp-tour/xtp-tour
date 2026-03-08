import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';
import { clearProfileCache } from '../hooks/useProfileStatus';
import { useAPI } from '../services/apiProvider';

const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const api = useAPI();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const displayName = user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User';

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await api.getUserProfile();
        if (response.profile?.role === 'admin') {
          setIsAdmin(true);
        }
      } catch {
        // Ignore errors - just don't show admin link
      }
    };
    checkRole();
  }, [api]);

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleAdminClick = () => {
    navigate('/admin');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    clearProfileCache();
    await signOut();
    setIsOpen(false);
  };

  return (
    <Dropdown show={isOpen} onToggle={(show) => setIsOpen(show)}>
      <Dropdown.Toggle
        variant="outline-primary"
        id="user-menu-dropdown"
        className="d-flex align-items-center gap-2"
      >
        <i className="bi bi-person-circle"></i>
        <span className="d-none d-md-inline">{displayName}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Item onClick={handleProfileClick}>
          <i className="bi bi-person me-2"></i>
          {t('userMenu.profile')}
        </Dropdown.Item>
        {isAdmin && (
          <Dropdown.Item onClick={handleAdminClick}>
            <i className="bi bi-gear me-2"></i>
            {t('userMenu.admin')}
          </Dropdown.Item>
        )}
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleSignOut}>
          <i className="bi bi-box-arrow-right me-2"></i>
          {t('userMenu.signOut')}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default UserMenu;
