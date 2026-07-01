import { useEffect, useState } from 'react';
import { Card, Title, Table, Text, Stack, Badge } from '@mantine/core';
import { listWallets } from '../../services/walletService';

export default function WalletManagementPage() {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    listWallets().then((res) => setWallets(res.wallets));
  }, []);

  return (
    <Stack>
      <Title order={2}>Wallet Management</Title>
      <Card withBorder radius="md" p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Deposit</Table.Th>
              <Table.Th>ROI</Table.Th>
              <Table.Th>Referral</Table.Th>
              <Table.Th>Level</Table.Th>
              <Table.Th>Incentive</Table.Th>
              <Table.Th>Withdrawal</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {wallets.map((w) => (
              <Table.Tr key={w._id}>
                <Table.Td>
                  {w.user?.name}
                  <br />
                  <Text size="xs" c="dimmed">
                    {w.user?.email}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={w.user?.status === 'active' ? 'green' : 'yellow'}>{w.user?.status}</Badge>
                </Table.Td>
                <Table.Td>${w.depositBalance.toFixed(2)}</Table.Td>
                <Table.Td>${w.roiBalance.toFixed(2)}</Table.Td>
                <Table.Td>${w.referralBalance.toFixed(2)}</Table.Td>
                <Table.Td>${w.levelBalance.toFixed(2)}</Table.Td>
                <Table.Td>${w.incentiveBalance.toFixed(2)}</Table.Td>
                <Table.Td>${w.withdrawalBalance.toFixed(2)}</Table.Td>
              </Table.Tr>
            ))}
            {wallets.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text c="dimmed">No wallets found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
