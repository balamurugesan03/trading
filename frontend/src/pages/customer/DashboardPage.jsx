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
import { getSummary } from '../../services/dashboardService';
import GlossyStatCard from '../../components/GlossyStatCard';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

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

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Badge size="lg" color={summary.accountStatus === 'active' ? 'green' : 'yellow'}>
          {summary.accountStatus}
        </Badge>
      </Group>

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
        />
        <GlossyStatCard
          label="Total ROI Earned"
          value={`$${summary.totalRoiEarned.toFixed(2)}`}
          color="green"
          icon={IconTrendingUp}
        />
        <GlossyStatCard
          label="Referral Income"
          value={`$${summary.referralIncome.toFixed(2)}`}
          color="grape"
          icon={IconUsers}
        />
        <GlossyStatCard
          label="Level Income"
          value={`$${summary.levelIncome.toFixed(2)}`}
          color="indigo"
          icon={IconGitBranch}
        />
        <GlossyStatCard
          label="Monthly Incentives"
          value={`$${summary.monthlyIncentiveIncome.toFixed(2)}`}
          color="orange"
          icon={IconAward}
        />
        <GlossyStatCard
          label="Deposit Balance"
          value={`$${summary.wallet.depositBalance.toFixed(2)}`}
          color="dark"
          icon={IconCash}
        />
        <GlossyStatCard
          label="Withdrawal Balance"
          value={`$${summary.wallet.withdrawalBalance.toFixed(2)}`}
          color="teal"
          icon={IconArrowDownCircle}
        />
        <GlossyStatCard label="Active Packages" value={summary.activePackages} color="red" icon={IconBox} />
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
    </Stack>
  );
}
