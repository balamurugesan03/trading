import { AppShell, Burger, Group, Menu, UnstyledButton, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate } from 'react-router-dom';
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
  IconChevronDown,
  IconLogout,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const groups = [
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
    links: [{ to: '/admin/notifications', label: 'Notifications', icon: IconBell }],
  },
];

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
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 10, 10, 0.72)',
          backdropFilter: 'blur(14px)',
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
          brandSubtitle="Admin Panel"
          groups={groups}
          user={{ initials: getInitials(user?.name), name: user?.name, role: user?.role }}
          onLogout={handleLogout}
        />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background:
            'radial-gradient(circle at 85% 0%, rgba(47, 125, 251, 0.08), transparent 45%), var(--mantine-color-dark-8)',
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
