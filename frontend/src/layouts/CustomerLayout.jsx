import { useEffect, useState } from 'react';
import { AppShell, Burger, Group, Badge, Menu, UnstyledButton, ActionIcon, Indicator } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  IconDashboard,
  IconCash,
  IconArrowDownCircle,
  IconWallet,
  IconUsers,
  IconFileCheck,
  IconChevronDown,
  IconLogout,
  IconUserCircle,
  IconHeadset,
  IconBell,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { myUnreadCount as mySupportUnreadCount, SUPPORT_READ_EVENT } from '../services/supportService';
import { myUnreadCount as myNotificationUnreadCount, NOTIFICATIONS_READ_EVENT } from '../services/notificationService';
import Sidebar from './Sidebar';

const UNREAD_POLL_INTERVAL = 15000;

function buildGroups(supportUnread) {
  return [
    {
      links: [
        { to: '/', label: 'Dashboard', icon: IconDashboard },
        { to: '/deposit', label: 'Deposit', icon: IconCash },
        { to: '/withdraw', label: 'Withdraw', icon: IconArrowDownCircle },
        { to: '/wallet', label: 'Wallet', icon: IconWallet },
        { to: '/team', label: 'My Team', icon: IconUsers },
        { to: '/kyc', label: 'KYC', icon: IconFileCheck },
        { to: '/profile', label: 'Profile', icon: IconUserCircle },
        { to: '/support', label: 'Support', icon: IconHeadset, badge: supportUnread },
      ],
    },
  ];
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function CustomerLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supportUnread, setSupportUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    const load = () => mySupportUnreadCount().then((res) => setSupportUnread(res.count)).catch(() => {});
    load();
    const interval = setInterval(load, UNREAD_POLL_INTERVAL);
    window.addEventListener(SUPPORT_READ_EVENT, load);
    return () => {
      clearInterval(interval);
      window.removeEventListener(SUPPORT_READ_EVENT, load);
    };
  }, []);

  useEffect(() => {
    const load = () => myNotificationUnreadCount().then((res) => setNotifUnread(res.count)).catch(() => {});
    load();
    const interval = setInterval(load, UNREAD_POLL_INTERVAL);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, load);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, load);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(14, 15, 22, 0.82), rgba(10, 10, 12, 0.72))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group gap="sm" ml="auto">
            <Indicator color="red" size={16} label={notifUnread > 9 ? '9+' : notifUnread} disabled={notifUnread === 0}>
              <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => navigate('/notifications')}>
                <IconBell size={18} />
              </ActionIcon>
            </Indicator>
            <Badge size="lg" color={user?.status === 'active' ? 'green' : 'yellow'}>
              {user?.status}
            </Badge>
            <Menu shadow="md" width={190} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={6}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #2f7dfb, #62a6ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(47, 125, 251, 0.35)',
                      }}
                    >
                      {getInitials(user?.name)}
                    </div>
                    <IconChevronDown size={14} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.name}</Menu.Label>
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0} style={{ border: 'none', background: '#050505' }}>
        <Sidebar
          brandSubtitle="Investment Platform"
          groups={buildGroups(supportUnread)}
          user={{ initials: getInitials(user?.name), name: user?.name, role: user?.role }}
          onLogout={handleLogout}
          onNavigate={close}
        />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background: `
            linear-gradient(rgba(255, 255, 255, 0.014) 1px, transparent 1px) 0 0 / 100% 56px,
            linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px) 0 0 / 56px 100%,
            radial-gradient(1200px 680px at 100% -8%, rgba(47, 125, 251, 0.20), transparent 55%),
            radial-gradient(950px 560px at -10% 10%, rgba(139, 92, 246, 0.15), transparent 52%),
            radial-gradient(700px 480px at 8% 100%, rgba(255, 176, 71, 0.05), transparent 55%),
            radial-gradient(900px 560px at 55% 120%, rgba(47, 125, 251, 0.08), transparent 60%),
            linear-gradient(160deg, #0d0e15 0%, #08090c 45%, #050506 100%)
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
