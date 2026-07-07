import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleGrid, Title, Stack, Text, Modal, Table, Center, Loader, Badge } from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconClock,
  IconWallet,
  IconTrendingUp,
  IconCircleCheck,
  IconCoin,
  IconCashBanknote,
  IconArrowDownCircle,
  IconGitBranch,
  IconAward,
  IconReceipt2,
} from '@tabler/icons-react';
import {
  getOverview,
  listInvestments,
  listReferralIncome,
  listLevelIncome,
  listTodayTransactions,
} from '../../services/reportService';
import GlossyStatCard from '../../components/GlossyStatCard';

const investmentColumns = [
  { header: 'User', cell: (i) => i.user?.name || '-' },
  { header: 'Package', cell: (i) => i.package?.name || '-' },
  { header: 'Amount', cell: (i) => `$${i.amount.toFixed(2)}` },
  { header: 'Returned', cell: (i) => `$${i.totalReturned.toFixed(2)}` },
  { header: 'Cap', cell: (i) => `$${i.capAmount.toFixed(2)}` },
  { header: 'Status', cell: (i) => <Badge color={i.status === 'active' ? 'green' : 'gray'}>{i.status}</Badge> },
  { header: 'Activated', cell: (i) => new Date(i.activatedAt).toLocaleDateString() },
];

const todayTxColumns = [
  { header: 'User', cell: (t) => t.user?.name || '-' },
  { header: 'Email', cell: (t) => t.user?.email || '-' },
  { header: 'Amount', cell: (t) => `$${t.amount.toFixed(2)}` },
  { header: 'Time', cell: (t) => new Date(t.createdAt).toLocaleTimeString() },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, kind: null });
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    getOverview().then((res) => setReport(res.report));
  }, []);

  const HISTORY_CONFIG = {
    roiPayoutToday: {
      title: "Today's ROI Payouts",
      fetch: () => listTodayTransactions({ source: 'roi_payout' }).then((res) => res.transactions),
      columns: todayTxColumns,
    },
    levelIncomeToday: {
      title: "Today's Level Income Payouts",
      fetch: () => listTodayTransactions({ source: 'level_income' }).then((res) => res.transactions),
      columns: todayTxColumns,
    },
    monthlyIncentiveToday: {
      title: "Today's Monthly Incentive Payouts",
      fetch: () => listTodayTransactions({ source: 'monthly_incentive' }).then((res) => res.transactions),
      columns: todayTxColumns,
    },
    totalCompanyPayoutToday: {
      title: "Today's Company Payouts (All Sources)",
      fetch: () => listTodayTransactions().then((res) => res.transactions),
      columns: [
        { header: 'User', cell: (t) => t.user?.name || '-' },
        { header: 'Source', cell: (t) => <Badge color="blue">{t.source.replace('_', ' ')}</Badge> },
        { header: 'Amount', cell: (t) => `$${t.amount.toFixed(2)}` },
        { header: 'Time', cell: (t) => new Date(t.createdAt).toLocaleTimeString() },
      ],
    },
    totalInvested: {
      title: 'All Investments',
      fetch: () => listInvestments().then((res) => res.investments),
      columns: investmentColumns,
    },
    activeInvestments: {
      title: 'Active Investments',
      fetch: () => listInvestments({ status: 'active' }).then((res) => res.investments),
      columns: investmentColumns,
    },
    closedInvestments: {
      title: 'Closed Investments',
      fetch: () => listInvestments({ status: 'closed' }).then((res) => res.investments),
      columns: investmentColumns,
    },
    totalRoiPaid: {
      title: 'Total ROI Paid (by Investment)',
      fetch: () => listInvestments().then((res) => res.investments),
      columns: investmentColumns,
    },
    totalReferralPaid: {
      title: 'Referral Income (All Users)',
      fetch: () => listReferralIncome().then((res) => res.records),
      columns: [
        { header: 'Earner', cell: (r) => r.user?.name || '-' },
        { header: 'From', cell: (r) => r.fromUser?.name || '-' },
        { header: 'Investment Amount', cell: (r) => `$${r.investmentAmount.toFixed(2)}` },
        { header: 'Percentage', cell: (r) => `${r.percentage}%` },
        { header: 'Bonus', cell: (r) => `$${r.amount.toFixed(2)}` },
        { header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
      ],
    },
    totalLevelPaid: {
      title: 'Level Income (All Users)',
      fetch: () => listLevelIncome().then((res) => res.records),
      columns: [
        { header: 'Earner', cell: (r) => r.user?.name || '-' },
        { header: 'From', cell: (r) => r.fromUser?.name || '-' },
        { header: 'Level', cell: (r) => `L${r.level}` },
        { header: 'ROI Amount', cell: (r) => `$${r.roiAmount.toFixed(2)}` },
        { header: 'Percentage', cell: (r) => `${r.percentage}%` },
        { header: 'Income', cell: (r) => `$${r.amount.toFixed(2)}` },
        { header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
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

  if (!report) return null;

  return (
    <Stack>
      <Title order={2}>Admin Dashboard</Title>

      <div>
        <Title order={4} mb={2}>
          Today&apos;s Financial Summary
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          Daily payout totals — what must be transferred to withdrawal wallets today.
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <GlossyStatCard
            label="ROI Payout Today"
            value={`$${report.roiPayoutToday.toFixed(2)}`}
            color="green"
            icon={IconCoin}
            onView={() => openHistory('roiPayoutToday')}
          />
          <GlossyStatCard
            label="Level Income Today"
            value={`$${report.levelIncomeToday.toFixed(2)}`}
            color="indigo"
            icon={IconGitBranch}
            onView={() => openHistory('levelIncomeToday')}
          />
          <GlossyStatCard
            label="Monthly Incentive Today"
            value={`$${report.monthlyIncentiveToday.toFixed(2)}`}
            color="red"
            icon={IconAward}
            onView={() => openHistory('monthlyIncentiveToday')}
          />
          <GlossyStatCard
            label="Total Company Payout"
            value={`$${report.totalCompanyPayoutToday.toFixed(2)}`}
            color="dark"
            icon={IconReceipt2}
            onView={() => openHistory('totalCompanyPayoutToday')}
          />
        </SimpleGrid>
      </div>

      <Title order={4} mb={-8}>
        Platform Overview
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <GlossyStatCard
          label="Total Users"
          value={report.totalUsers}
          color="blue"
          icon={IconUsers}
          onView={() => navigate('/admin/users')}
        />
        <GlossyStatCard
          label="Active Users"
          value={report.activeUsers}
          color="green"
          icon={IconUserCheck}
          onView={() => navigate('/admin/users?status=active')}
        />
        <GlossyStatCard
          label="Pending Activation"
          value={report.pendingActivation}
          color="yellow"
          icon={IconClock}
          onView={() => navigate('/admin/users?status=pending_activation')}
        />
        <GlossyStatCard
          label="Total Invested"
          value={`$${report.totalInvested.toFixed(2)}`}
          color="dark"
          icon={IconWallet}
          onView={() => openHistory('totalInvested')}
        />
        <GlossyStatCard
          label="Active Investments"
          value={report.activeInvestments}
          color="teal"
          icon={IconTrendingUp}
          onView={() => openHistory('activeInvestments')}
        />
        <GlossyStatCard
          label="Closed Investments"
          value={report.closedInvestments}
          color="gray"
          icon={IconCircleCheck}
          onView={() => openHistory('closedInvestments')}
        />
        <GlossyStatCard
          label="Total ROI Paid"
          value={`$${report.totalRoiPaid.toFixed(2)}`}
          color="green"
          icon={IconCoin}
          onView={() => openHistory('totalRoiPaid')}
        />
        <GlossyStatCard
          label="Pending Deposits"
          value={report.pendingDeposits}
          color="orange"
          icon={IconCashBanknote}
          onView={() => navigate('/admin/deposits')}
        />
        <GlossyStatCard
          label="Pending Withdrawals"
          value={report.pendingWithdrawals}
          color="orange"
          icon={IconArrowDownCircle}
          onView={() => navigate('/admin/withdrawals')}
        />
        <GlossyStatCard
          label="Total Referral Paid"
          value={`$${report.totalReferralPaid.toFixed(2)}`}
          color="grape"
          icon={IconUsers}
          onView={() => openHistory('totalReferralPaid')}
        />
        <GlossyStatCard
          label="Total Level Paid"
          value={`$${report.totalLevelPaid.toFixed(2)}`}
          color="indigo"
          icon={IconGitBranch}
          onView={() => openHistory('totalLevelPaid')}
        />
        <GlossyStatCard
          label="Total Incentive Paid"
          value={`$${report.totalIncentivePaid.toFixed(2)}`}
          color="red"
          icon={IconAward}
          onView={() => navigate('/admin/incentives')}
        />
      </SimpleGrid>

      <Modal
        opened={historyModal.open}
        onClose={() => setHistoryModal({ open: false, kind: null })}
        title={activeConfig?.title || ''}
        size="xl"
      >
        {historyLoading ? (
          <Center py="lg">
            <Loader />
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={500}>
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
          </Table.ScrollContainer>
        )}
      </Modal>
    </Stack>
  );
}
