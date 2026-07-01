import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Text, Stack } from '@mantine/core';
import { getTeam } from '../../services/dashboardService';

export default function TeamPage() {
  const [directReferrals, setDirectReferrals] = useState([]);

  useEffect(() => {
    getTeam().then((res) => setDirectReferrals(res.directReferrals));
  }, []);

  return (
    <Stack>
      <Title order={2}>My Team</Title>
      <Card withBorder radius="md" p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Total Invested</Table.Th>
              <Table.Th>Joined</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {directReferrals.map((d) => (
              <Table.Tr key={d._id}>
                <Table.Td>{d.name}</Table.Td>
                <Table.Td>{d.email}</Table.Td>
                <Table.Td>
                  <Badge color={d.status === 'active' ? 'green' : 'yellow'}>{d.status}</Badge>
                </Table.Td>
                <Table.Td>${d.totalInvested.toFixed(2)}</Table.Td>
                <Table.Td>{new Date(d.createdAt).toLocaleDateString()}</Table.Td>
              </Table.Tr>
            ))}
            {directReferrals.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No referrals yet</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
