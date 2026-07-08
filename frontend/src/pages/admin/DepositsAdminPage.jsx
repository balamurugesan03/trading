import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Button, Group, Select, Stack, Text, Anchor, Modal, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listDeposits, approveDeposit, rejectDeposit } from '../../services/depositService';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function DepositsAdminPage() {
  const [deposits, setDeposits] = useState([]);
  const [status, setStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });

  const load = () => listDeposits(status ? { status } : {}).then((res) => setDeposits(res.deposits));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (id) => {
    try {
      await approveDeposit(id);
      notifications.show({ title: 'Approved', message: 'Deposit approved and investment activated', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const handleReject = async () => {
    try {
      await rejectDeposit(rejectModal.id, rejectModal.reason);
      notifications.show({ title: 'Rejected', message: 'Deposit rejected', color: 'orange' });
      setRejectModal({ open: false, id: null, reason: '' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>Deposits</Title>
      <Card withBorder radius="md" p="md">
        <Group mb="sm">
          <Select value={status} onChange={setStatus} data={['pending', 'approved', 'rejected']} clearable w={200} />
        </Group>
        <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Reference</Table.Th>
              <Table.Th>Screenshot</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {deposits.map((d) => (
              <Table.Tr key={d._id}>
                <Table.Td>
                  {d.user?.name}
                  <br />
                  <Text size="xs" c="dimmed">
                    {d.user?.email}
                  </Text>
                </Table.Td>
                <Table.Td>${d.amount.toFixed(2)}</Table.Td>
                <Table.Td>{d.txReference}</Table.Td>
                <Table.Td>
                  <Anchor href={`${API_ORIGIN}${d.screenshotUrl}`} target="_blank">
                    View
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Badge color={d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : 'yellow'}>
                    {d.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {d.status === 'pending' && (
                    <Group gap="xs">
                      <Button size="xs" color="green" onClick={() => handleApprove(d._id)}>
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => setRejectModal({ open: true, id: d._id, reason: '' })}
                      >
                        Reject
                      </Button>
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {deposits.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed">No records found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal
        opened={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null, reason: '' })}
        title="Reject Deposit"
      >
        <Stack>
          <Textarea
            label="Reason"
            value={rejectModal.reason}
            onChange={(e) => {
              const { value } = e.currentTarget;
              setRejectModal((prev) => ({ ...prev, reason: value }));
            }}
          />
          <Button color="red" onClick={handleReject}>
            Confirm Reject
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
