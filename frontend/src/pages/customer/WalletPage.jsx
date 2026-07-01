import { useEffect, useState } from 'react';
import { SimpleGrid, Card, Text, Title, Stack, Table, Badge, Select, Group, NumberInput, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCash,
  IconTrendingUp,
  IconUsers,
  IconGitBranch,
  IconAward,
  IconArrowDownCircle,
} from '@tabler/icons-react';
import { myWallet, myTransactions, transferToWithdrawal } from '../../services/walletService';
import GlossyStatCard from '../../components/GlossyStatCard';

const WALLET_LABELS = {
  depositBalance: 'Deposit Wallet',
  roiBalance: 'ROI Wallet',
  referralBalance: 'Referral Wallet',
  levelBalance: 'Level Income Wallet',
  incentiveBalance: 'Monthly Incentive Wallet',
  withdrawalBalance: 'Withdrawal Wallet',
};

const WALLET_STYLE = {
  depositBalance: { color: 'dark', icon: IconCash },
  roiBalance: { color: 'green', icon: IconTrendingUp },
  referralBalance: { color: 'grape', icon: IconUsers },
  levelBalance: { color: 'indigo', icon: IconGitBranch },
  incentiveBalance: { color: 'orange', icon: IconAward },
  withdrawalBalance: { color: 'teal', icon: IconArrowDownCircle },
};

const TRANSFER_SOURCES = [
  { value: 'roi', label: 'ROI Wallet' },
  { value: 'referral', label: 'Referral Wallet' },
  { value: 'level', label: 'Level Income Wallet' },
  { value: 'incentive', label: 'Monthly Incentive Wallet' },
];

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState(null);
  const [transferFrom, setTransferFrom] = useState('roi');
  const [transferAmount, setTransferAmount] = useState(0);

  const loadWallet = () => myWallet().then((res) => setWallet(res.wallet));
  const loadTransactions = () => myTransactions(filter).then((res) => setTransactions(res.transactions));

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleTransfer = async () => {
    try {
      await transferToWithdrawal(transferFrom, transferAmount);
      notifications.show({ title: 'Transferred', message: 'Funds moved to withdrawal wallet', color: 'green' });
      setTransferAmount(0);
      loadWallet();
      loadTransactions();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Transfer failed', color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>Wallet</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {wallet &&
          Object.entries(WALLET_LABELS).map(([field, label]) => (
            <GlossyStatCard
              key={field}
              label={label}
              value={`$${Number(wallet[field] || 0).toFixed(2)}`}
              color={WALLET_STYLE[field].color}
              icon={WALLET_STYLE[field].icon}
            />
          ))}
      </SimpleGrid>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Move Earnings to Withdrawal Wallet
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          Transfer available balance from your income wallets into the withdrawal wallet before requesting a
          withdrawal.
        </Text>
        <Group align="flex-end">
          <Select label="From" value={transferFrom} onChange={setTransferFrom} data={TRANSFER_SOURCES} w={220} />
          <NumberInput label="Amount" min={0} decimalScale={2} value={transferAmount} onChange={setTransferAmount} w={160} />
          <Button onClick={handleTransfer}>Transfer</Button>
        </Group>
      </Card>

      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Transaction History</Title>
          <Select
            placeholder="All wallets"
            clearable
            value={filter}
            onChange={setFilter}
            data={[
              { value: 'deposit', label: 'Deposit' },
              { value: 'roi', label: 'ROI' },
              { value: 'referral', label: 'Referral' },
              { value: 'level', label: 'Level' },
              { value: 'incentive', label: 'Incentive' },
              { value: 'withdrawal', label: 'Withdrawal' },
            ]}
            w={200}
          />
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Wallet</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Balance After</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {transactions.map((tx) => (
              <Table.Tr key={tx._id}>
                <Table.Td>{WALLET_LABELS[`${tx.wallet}Balance`] || tx.wallet}</Table.Td>
                <Table.Td>
                  <Badge color={tx.type === 'credit' ? 'green' : 'red'}>{tx.type}</Badge>
                </Table.Td>
                <Table.Td>${tx.amount.toFixed(2)}</Table.Td>
                <Table.Td>${tx.balanceAfter.toFixed(2)}</Table.Td>
                <Table.Td>{tx.description}</Table.Td>
                <Table.Td>{new Date(tx.createdAt).toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
            {transactions.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed">No transactions yet</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
