import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';

const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User';

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
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

