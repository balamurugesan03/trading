import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Button, Group, TextInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listUsers, suspendUser, activateUser } from '../../services/userService';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => listUsers(search ? { search } : {}).then((res) => setUsers(res.users));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (action, id) => {
    try {
      if (action === 'suspend') await suspendUser(id);
      else await activateUser(id);
      notifications.show({ title: 'Success', message: 'User updated', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>Users</Title>
      <Card withBorder radius="md" p="md">
        <Group mb="sm">
          <TextInput
            placeholder="Search by name, email or referral code"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            w={350}
          />
          <Button onClick={load}>Search</Button>
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Referral Code</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>KYC</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u._id}>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>{u.role}</Table.Td>
                <Table.Td>{u.referralCode}</Table.Td>
                <Table.Td>
                  <Badge color={u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'yellow'}>
                    {u.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={u.kycStatus === 'approved' ? 'green' : u.kycStatus === 'rejected' ? 'red' : 'yellow'}
                  >
                    {u.kycStatus}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {u.status !== 'suspended' ? (
                      <Button size="xs" color="red" variant="light" onClick={() => handleAction('suspend', u._id)}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="xs" color="green" variant="light" onClick={() => handleAction('activate', u._id)}>
                        Activate
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {users.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed">No users found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
