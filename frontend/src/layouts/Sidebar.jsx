import { ScrollArea, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import logoMark from '../assets/logo-mark.png';
import classes from './Sidebar.module.css';

export default function Sidebar({ brandSubtitle, groups, user, onLogout, onNavigate, variant }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (to) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <div className={`${classes.navbar} ${variant === 'customer' ? classes.navbarCustomer : ''}`}>
      <div className={classes.brand}>
        <img src={logoMark} alt="Velocity" className={classes.brandMark} />
        <div>
          <div className={classes.brandText}>Velocity</div>
          <div className={classes.brandSub}>{brandSubtitle}</div>
        </div>
      </div>

      <ScrollArea className={classes.scroll} type="auto" offsetScrollbars>
        {groups.map((group) => (
          <div key={group.label || 'main'}>
            {group.label && <div className={classes.sectionLabel}>{group.label}</div>}
            {group.links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <div
                  key={link.to}
                  className={`${classes.navItem} ${active ? classes.navItemActive : ''}`}
                  onClick={() => handleNavigate(link.to)}
                >
                  <link.icon size={17} stroke={1.75} />
                  <span style={{ flex: 1 }}>{link.label}</span>
                  {!!link.badge && (
                    <Badge size="sm" color="red" circle>
                      {link.badge}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </ScrollArea>

      <div className={classes.footer}>
        <div className={classes.userCard}>
          <div className={classes.avatar}>{user.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={classes.userName}>{user.name}</div>
            <div className={classes.userRole}>{user.role?.replace('_', ' ')}</div>
          </div>
          <Tooltip label="Logout">
            <ActionIcon variant="subtle" color="gray" onClick={onLogout}>
              <IconLogout size={16} color="white" />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
