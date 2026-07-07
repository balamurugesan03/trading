import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Text, Stack, TextInput, Group } from '@mantine/core';
import { listIncentives } from '../../services/incentiveService';

export default function IncentivesAdminPage() {
  const [incentives, setIncentives] = useState([]);
  const [month, setMonth] = useState('');

  const load = () => listIncentives(month ? { month } : {}).then((res) => setIncentives(res.incentives));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <Stack>
      <Title order={2}>Monthly Incentives</Title>
      <Card withBorder radius="md" p="md">
        <Group mb="sm">
          <TextInput
            label="Filter by month"
            placeholder="YYYY-MM"
            value={month}
            onChange={(e) => setMonth(e.currentTarget.value)}
            w={200}
          />
        </Group>
        <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Month</Table.Th>
              <Table.Th>Direct Business</Table.Th>
              <Table.Th>Reward %</Table.Th>
              <Table.Th>Reward Amount</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {incentives.map((i) => (
              <Table.Tr key={i._id}>
                <Table.Td>
                  {i.user?.name}
                  <br />
                  <Text size="xs" c="dimmed">
                    {i.user?.email}
                  </Text>
                </Table.Td>
                <Table.Td>{i.month}</Table.Td>
                <Table.Td>${i.directBusiness.toFixed(2)}</Table.Td>
                <Table.Td>{i.percentage}%</Table.Td>
                <Table.Td>${i.rewardAmount.toFixed(2)}</Table.Td>
                <Table.Td>
                  <Badge color={i.status === 'transferred' ? 'green' : 'yellow'}>{i.status}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {incentives.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed">No incentive records found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
}
