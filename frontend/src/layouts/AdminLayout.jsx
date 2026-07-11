import { useEffect, useState } from 'react';
import { AppShell, Burger, Group, Menu, UnstyledButton, ActionIcon, MantineProvider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate } from 'react-router-dom';
import { luxuryTheme } from '../theme.js';
import {
  IconDashboard,
  IconUsers,
  IconFileCheck,
  IconCash,
  IconArrowDownCircle,
  IconBox,
  IconPercentage,
  IconGitBranch,
  IconAward,
  IconWallet,
  IconReportAnalytics,
  IconBell,
  IconHeadset,
  IconChevronDown,
  IconLogout,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { unreadCount, SUPPORT_READ_EVENT } from '../services/supportService';
import Sidebar from './Sidebar';

const UNREAD_POLL_INTERVAL = 15000;

function buildGroups(supportUnread) {
  return [
    {
      label: 'Overview',
      links: [
        { to: '/admin', label: 'Dashboard', icon: IconDashboard },
        { to: '/admin/reports', label: 'Reports', icon: IconReportAnalytics },
      ],
    },
    {
      label: 'People',
      links: [
        { to: '/admin/users', label: 'Users', icon: IconUsers },
        { to: '/admin/kyc', label: 'KYC', icon: IconFileCheck },
      ],
    },
    {
      label: 'Finance',
      links: [
        { to: '/admin/deposits', label: 'Deposits', icon: IconCash },
        { to: '/admin/withdrawals', label: 'Withdrawals', icon: IconArrowDownCircle },
        { to: '/admin/wallets', label: 'Wallet Management', icon: IconWallet },
        { to: '/admin/incentives', label: 'Monthly Incentives', icon: IconAward },
      ],
    },
    {
      label: 'Configuration',
      links: [
        { to: '/admin/packages', label: 'Packages', icon: IconBox },
        { to: '/admin/roi-settings', label: 'ROI Settings', icon: IconPercentage },
        { to: '/admin/level-settings', label: 'Referral & Level Settings', icon: IconGitBranch },
      ],
    },
    {
      label: 'Communication',
      links: [
        { to: '/admin/notifications', label: 'Notifications', icon: IconBell },
        { to: '/admin/support', label: 'Customer Support', icon: IconHeadset, badge: supportUnread },
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

export default function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    const load = () => unreadCount().then((res) => setSupportUnread(res.count)).catch(() => {});
    load();
    const interval = setInterval(load, UNREAD_POLL_INTERVAL);
    window.addEventListener(SUPPORT_READ_EVENT, load);
    return () => {
      clearInterval(interval);
      window.removeEventListener(SUPPORT_READ_EVENT, load);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MantineProvider theme={luxuryTheme} cssVariablesSelector=".velocity-luxury" forceColorScheme="dark">
    <div className="velocity-luxury">
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid rgba(212, 175, 55, 0.22)',
          background: 'linear-gradient(180deg, rgba(20, 16, 8, 0.92), rgba(5, 4, 3, 0.85))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group gap="sm" ml="auto">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => navigate('/admin/notifications')}>
              <IconBell size={18} />
            </ActionIcon>
            <Menu shadow="md" width={190} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={6}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #FFD86B, #D4AF37)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1408',
                        fontWeight: 700,
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
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

      <AppShell.Navbar p={0} style={{ border: 'none', background: '#0b0b0b' }}>
        <Sidebar
          brandSubtitle="Admin Panel"
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
            linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px) 0 0 / 100% 56px,
            linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px) 0 0 / 56px 100%,
            linear-gradient(115deg, transparent 46%, rgba(212, 175, 55, 0.05) 50%, transparent 54%) 0 0 / 220px 220px,
            radial-gradient(1200px 680px at 100% -8%, rgba(212, 175, 55, 0.16), transparent 55%),
            radial-gradient(950px 560px at -10% 10%, rgba(255, 216, 107, 0.08), transparent 52%),
            radial-gradient(700px 480px at 8% 100%, rgba(212, 175, 55, 0.06), transparent 55%),
            radial-gradient(900px 560px at 55% 120%, rgba(255, 216, 107, 0.05), transparent 60%),
            linear-gradient(160deg, #14100a 0%, #0d0a06 45%, #0b0b0b 100%)
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
    </div>
    </MantineProvider>
  );
}
