import { useEffect, useState } from 'react';
import {
  SimpleGrid,
  Card,
  Text,
  Title,
  Group,
  Loader,
  Center,
  CopyButton,
  Button,
  Badge,
  Table,
  Stack,
  Modal,
} from '@mantine/core';
import {
  IconCopy,
  IconCheck,
  IconWallet,
  IconTrendingUp,
  IconUsers,
  IconGitBranch,
  IconAward,
  IconCash,
  IconArrowDownCircle,
  IconBox,
} from '@tabler/icons-react';
import { getSummary, getReferralHistory, getLevelIncomeHistory, getIncentiveHistory } from '../../services/dashboardService';
import { myDeposits } from '../../services/depositService';
import { myTransactions } from '../../services/walletService';
import GlossyStatCard from '../../components/GlossyStatCard';
import UserProfileCard from '../../components/UserProfileCard';
import NotificationTicker from '../../components/NotificationTicker';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, kind: null });
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    getSummary().then((res) => setSummary(res.summary));
  }, []);

  if (!summary) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }

  const HISTORY_CONFIG = {
    totalInvested: {
      title: 'Deposit History',
      fetch: () => myDeposits().then((res) => res.deposits),
      columns: [
        { header: 'Amount', cell: (d) => `$${d.amount.toFixed(2)}` },
        { header: 'Reference', cell: (d) => d.txReference },
        {
          header: 'Status',
          cell: (d) => (
            <Badge color={d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : 'yellow'}>
              {d.status}
            </Badge>
          ),
        },
        { header: 'Date', cell: (d) => new Date(d.createdAt).toLocaleString() },
      ],
    },
    totalRoi: {
      title: 'ROI Payout History',
      fetch: () => myTransactions('roi').then((res) => res.transactions),
      columns: [
        { header: 'Date', cell: (t) => new Date(t.createdAt).toLocaleString() },
        { header: 'Description', cell: (t) => t.description },
        { header: 'Amount', cell: (t) => `$${t.amount.toFixed(2)}` },
        { header: 'Balance After', cell: (t) => `$${t.balanceAfter.toFixed(2)}` },
      ],
    },
    referralIncome: {
      title: 'Referral Income History',
      fetch: () => getReferralHistory().then((res) => res.records),
      columns: [
        { header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
        { header: 'From', cell: (r) => r.fromUser?.name || '-' },
        { header: 'Investment Amount', cell: (r) => `$${r.investmentAmount.toFixed(2)}` },
        { header: 'Percentage', cell: (r) => `${r.percentage}%` },
        { header: 'Bonus', cell: (r) => `$${r.amount.toFixed(2)}` },
      ],
    },
    levelIncome: {
      title: 'Level Income History',
      fetch: () => getLevelIncomeHistory().then((res) => res.records),
      columns: [
        { header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
        { header: 'From', cell: (r) => r.fromUser?.name || '-' },
        { header: 'Level', cell: (r) => `L${r.level}` },
        { header: 'ROI Amount', cell: (r) => `$${r.roiAmount.toFixed(2)}` },
        { header: 'Percentage', cell: (r) => `${r.percentage}%` },
        { header: 'Income', cell: (r) => `$${r.amount.toFixed(2)}` },
      ],
    },
    monthlyIncentive: {
      title: 'Monthly Incentive History',
      fetch: () => getIncentiveHistory().then((res) => res.records),
      columns: [
        { header: 'Month', cell: (r) => r.month },
        { header: 'Direct Business', cell: (r) => `$${r.directBusiness.toFixed(2)}` },
        { header: 'Percentage', cell: (r) => `${r.percentage}%` },
        { header: 'Reward', cell: (r) => `$${r.rewardAmount.toFixed(2)}` },
        {
          header: 'Status',
          cell: (r) => <Badge color={r.status === 'transferred' ? 'green' : 'yellow'}>{r.status}</Badge>,
        },
      ],
    },
    depositBalance: {
      title: 'Deposit Wallet Transactions',
      fetch: () => myTransactions('deposit').then((res) => res.transactions),
      columns: [
        { header: 'Date', cell: (t) => new Date(t.createdAt).toLocaleString() },
        { header: 'Type', cell: (t) => <Badge color={t.type === 'credit' ? 'green' : 'red'}>{t.type}</Badge> },
        { header: 'Description', cell: (t) => t.description },
        { header: 'Amount', cell: (t) => `$${t.amount.toFixed(2)}` },
        { header: 'Balance After', cell: (t) => `$${t.balanceAfter.toFixed(2)}` },
      ],
    },
    withdrawalBalance: {
      title: 'Withdrawal Wallet Transactions',
      fetch: () => myTransactions('withdrawal').then((res) => res.transactions),
      columns: [
        { header: 'Date', cell: (t) => new Date(t.createdAt).toLocaleString() },
        { header: 'Type', cell: (t) => <Badge color={t.type === 'credit' ? 'green' : 'red'}>{t.type}</Badge> },
        { header: 'Description', cell: (t) => t.description },
        { header: 'Amount', cell: (t) => `$${t.amount.toFixed(2)}` },
        { header: 'Balance After', cell: (t) => `$${t.balanceAfter.toFixed(2)}` },
      ],
    },
    activePackages: {
      title: 'Active Packages',
      fetch: () => Promise.resolve(summary.investments),
      columns: [
        { header: 'Package', cell: (i) => i.package?.name },
        { header: 'Amount', cell: (i) => `$${i.amount.toFixed(2)}` },
        { header: 'Returned', cell: (i) => `$${i.totalReturned.toFixed(2)}` },
        { header: 'Cap', cell: (i) => `$${i.capAmount.toFixed(2)}` },
        { header: 'Status', cell: (i) => <Badge color={i.status === 'active' ? 'green' : 'gray'}>{i.status}</Badge> },
        { header: 'Activated', cell: (i) => new Date(i.activatedAt).toLocaleDateString() },
      ],
    },
  };

  const openHistory = async (kind) => {
    setHistoryModal({ open: true, kind });
    setHistoryLoading(true);
    try {
      const rows = await HISTORY_CONFIG[kind].fetch();
      setHistoryRows(rows);
    } finally {
      setHistoryLoading(false);
    }
  };

  const activeConfig = historyModal.kind ? HISTORY_CONFIG[historyModal.kind] : null;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Badge size="lg" color={summary.accountStatus === 'active' ? 'green' : 'yellow'}>
          {summary.accountStatus}
        </Badge>
      </Group>

      <NotificationTicker />

      <UserProfileCard
        userId={summary.referralCode}
        name={summary.name}
        invitedBy={summary.invitedBy}
        progress={summary.energyProgress}
      />

      <Card withBorder radius="md" p="md">
        <Text size="sm" c="dimmed" mb={4}>
          Your Referral Link
        </Text>
        <Group>
          <Text ff="monospace">{summary.referralLink}</Text>
          <CopyButton value={summary.referralLink}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="light"
                color={copied ? 'teal' : 'blue'}
                leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                onClick={copy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <GlossyStatCard
          label="Total Invested"
          value={`$${summary.totalInvested.toFixed(2)}`}
          color="blue"
          icon={IconWallet}
          onView={() => openHistory('totalInvested')}
        />
        <GlossyStatCard
          label="Total ROI Earned"
          value={`$${summary.totalRoiEarned.toFixed(2)}`}
          color="green"
          icon={IconTrendingUp}
          onView={() => openHistory('totalRoi')}
        />
        <GlossyStatCard
          label="Referral Income"
          value={`$${summary.referralIncome.toFixed(2)}`}
          color="grape"
          icon={IconUsers}
          onView={() => openHistory('referralIncome')}
        />
        <GlossyStatCard
          label="Level Income"
          value={`$${summary.levelIncome.toFixed(2)}`}
          color="indigo"
          icon={IconGitBranch}
          onView={() => openHistory('levelIncome')}
        />
        <GlossyStatCard
          label="Monthly Incentives"
          value={`$${summary.monthlyIncentiveIncome.toFixed(2)}`}
          color="orange"
          icon={IconAward}
          onView={() => openHistory('monthlyIncentive')}
        />
        <GlossyStatCard
          label="Deposit Balance"
          value={`$${summary.wallet.depositBalance.toFixed(2)}`}
          color="dark"
          icon={IconCash}
          onView={() => openHistory('depositBalance')}
        />
        <GlossyStatCard
          label="Withdrawal Balance"
          value={`$${summary.wallet.withdrawalBalance.toFixed(2)}`}
          color="teal"
          icon={IconArrowDownCircle}
          onView={() => openHistory('withdrawalBalance')}
        />
        <GlossyStatCard
          label="Active Packages"
          value={summary.activePackages}
          color="red"
          icon={IconBox}
          onView={() => openHistory('activePackages')}
        />
      </SimpleGrid>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Active Packages
        </Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Package</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Returned</Table.Th>
              <Table.Th>Cap</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Activated</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {summary.investments.map((inv) => (
              <Table.Tr key={inv._id}>
                <Table.Td>{inv.package?.name}</Table.Td>
                <Table.Td>${inv.amount.toFixed(2)}</Table.Td>
                <Table.Td>${inv.totalReturned.toFixed(2)}</Table.Td>
                <Table.Td>${inv.capAmount.toFixed(2)}</Table.Td>
                <Table.Td>
                  <Badge color={inv.status === 'active' ? 'green' : 'gray'}>{inv.status}</Badge>
                </Table.Td>
                <Table.Td>{new Date(inv.activatedAt).toLocaleDateString()}</Table.Td>
              </Table.Tr>
            ))}
            {summary.investments.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed">No investments yet</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={historyModal.open}
        onClose={() => setHistoryModal({ open: false, kind: null })}
        title={activeConfig?.title || ''}
        size="lg"
      >
        {historyLoading ? (
          <Center py="lg">
            <Loader />
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {activeConfig?.columns.map((c) => (
                  <Table.Th key={c.header}>{c.header}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {historyRows.map((row, i) => (
                <Table.Tr key={row._id || i}>
                  {activeConfig?.columns.map((c) => <Table.Td key={c.header}>{c.cell(row)}</Table.Td>)}
                </Table.Tr>
              ))}
              {historyRows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={activeConfig?.columns.length || 1}>
                    <Text c="dimmed">No records yet</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Modal>
    </Stack>
  );
}
