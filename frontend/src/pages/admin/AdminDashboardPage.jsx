import { useEffect, useState } from 'react';
import { SimpleGrid, Title, Stack } from '@mantine/core';
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
} from '@tabler/icons-react';
import { getOverview } from '../../services/reportService';
import GlossyStatCard from '../../components/GlossyStatCard';

export default function AdminDashboardPage() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    getOverview().then((res) => setReport(res.report));
  }, []);

  if (!report) return null;

  return (
    <Stack>
      <Title order={2}>Admin Dashboard</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <GlossyStatCard label="Total Users" value={report.totalUsers} color="blue" icon={IconUsers} />
        <GlossyStatCard label="Active Users" value={report.activeUsers} color="green" icon={IconUserCheck} />
        <GlossyStatCard
          label="Pending Activation"
          value={report.pendingActivation}
          color="yellow"
          icon={IconClock}
        />
        <GlossyStatCard
          label="Total Invested"
          value={`$${report.totalInvested.toFixed(2)}`}
          color="dark"
          icon={IconWallet}
        />
        <GlossyStatCard
          label="Active Investments"
          value={report.activeInvestments}
          color="teal"
          icon={IconTrendingUp}
        />
        <GlossyStatCard
          label="Closed Investments"
          value={report.closedInvestments}
          color="gray"
          icon={IconCircleCheck}
        />
        <GlossyStatCard
          label="Total ROI Paid"
          value={`$${report.totalRoiPaid.toFixed(2)}`}
          color="green"
          icon={IconCoin}
        />
        <GlossyStatCard
          label="Pending Deposits"
          value={report.pendingDeposits}
          color="orange"
          icon={IconCashBanknote}
        />
        <GlossyStatCard
          label="Pending Withdrawals"
          value={report.pendingWithdrawals}
          color="orange"
          icon={IconArrowDownCircle}
        />
        <GlossyStatCard
          label="Total Referral Paid"
          value={`$${report.totalReferralPaid.toFixed(2)}`}
          color="grape"
          icon={IconUsers}
        />
        <GlossyStatCard
          label="Total Level Paid"
          value={`$${report.totalLevelPaid.toFixed(2)}`}
          color="indigo"
          icon={IconGitBranch}
        />
        <GlossyStatCard
          label="Total Incentive Paid"
          value={`$${report.totalIncentivePaid.toFixed(2)}`}
          color="red"
          icon={IconAward}
        />
      </SimpleGrid>
    </Stack>
  );
}
