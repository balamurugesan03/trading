import { AppShell, Burger, Group, Badge, Menu, UnstyledButton } from '@mantine/core';
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
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const groups = [
  {
    links: [
      { to: '/', label: 'Dashboard', icon: IconDashboard },
      { to: '/deposit', label: 'Deposit', icon: IconCash },
      { to: '/withdraw', label: 'Withdraw', icon: IconArrowDownCircle },
      { to: '/wallet', label: 'Wallet', icon: IconWallet },
      { to: '/team', label: 'My Team', icon: IconUsers },
      { to: '/kyc', label: 'KYC', icon: IconFileCheck },
    ],
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

export default function CustomerLayout() {
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
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
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
