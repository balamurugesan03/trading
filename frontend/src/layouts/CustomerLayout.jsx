import { useEffect, useRef, useState } from 'react';
import { AppShell, Burger, Group, Badge, Menu, UnstyledButton, ActionIcon, Indicator, Text, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
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
  const { user, logout, isImpersonating, returnToAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [supportUnread, setSupportUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const mainRef = useRef(null);

  // Every page fades + rises in on navigation - a consistent, lightweight "premium"
  // transition across the whole panel without needing per-page animation code.
  useEffect(() => {
    if (!mainRef.current) return;
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }
    );
  }, [location.pathname]);

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

  const handleReturnToAdmin = () => {
    returnToAdmin();
    navigate('/admin/users');
  };

  return (
    <AppShell
      header={{ height: isImpersonating ? 96 : 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(10, 22, 46, 0.85), rgba(5, 8, 16, 0.75))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {isImpersonating && (
          <Group
            justify="space-between"
            px="md"
            py={6}
            style={{
              background: 'rgba(255, 161, 22, 0.16)',
              borderBottom: '1px solid rgba(255, 161, 22, 0.4)',
            }}
          >
            <Text size="xs" fw={600} c="orange">
              Admin session: viewing as {user?.name}
            </Text>
            <Button size="compact-xs" color="orange" onClick={handleReturnToAdmin}>
              Return to Admin
            </Button>
          </Group>
        )}
        <Group h={60} px="md" justify="space-between">
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
                        background: 'linear-gradient(135deg, #00d9ff, #2f7dfb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(0, 217, 255, 0.35)',
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

      <AppShell.Navbar p={0} style={{ border: 'none', background: '#050b16' }}>
        <Sidebar
          brandSubtitle="Investment Platform"
          groups={buildGroups(supportUnread)}
          user={{ initials: getInitials(user?.name), name: user?.name, role: user?.role }}
          onLogout={handleLogout}
          onNavigate={close}
          variant="customer"
        />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background: `
            linear-gradient(rgba(255, 255, 255, 0.014) 1px, transparent 1px) 0 0 / 100% 56px,
            linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px) 0 0 / 56px 100%,
            radial-gradient(1200px 680px at 100% -8%, rgba(0, 217, 255, 0.20), transparent 55%),
            radial-gradient(950px 560px at -10% 10%, rgba(47, 125, 251, 0.18), transparent 52%),
            radial-gradient(700px 480px at 8% 100%, rgba(47, 125, 251, 0.07), transparent 55%),
            radial-gradient(900px 560px at 55% 120%, rgba(0, 217, 255, 0.08), transparent 60%),
            linear-gradient(160deg, #0b1530 0%, #081026 45%, #05070d 100%)
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        <div ref={mainRef}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
