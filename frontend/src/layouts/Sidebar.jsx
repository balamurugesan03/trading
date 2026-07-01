import { ScrollArea, ActionIcon, Tooltip } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import classes from './Sidebar.module.css';

export default function Sidebar({ brandTitle, brandSubtitle, brandIcon: BrandIcon, groups, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={classes.navbar}>
      <div className={classes.brand}>
        <div className={classes.brandIcon}>
          <BrandIcon size={19} stroke={1.75} />
        </div>
        <div>
          <div className={classes.brandText}>{brandTitle}</div>
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
                  onClick={() => navigate(link.to)}
                >
                  <link.icon size={17} stroke={1.75} />
                  <span>{link.label}</span>
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
