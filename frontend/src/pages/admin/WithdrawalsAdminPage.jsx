import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Button, Group, Select, Stack, Text, Modal, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listWithdrawals, approveWithdrawal, markPaid, rejectWithdrawal } from '../../services/withdrawalService';

export default function WithdrawalsAdminPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState('pending_approval');
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [payModal, setPayModal] = useState({ open: false, id: null, txHash: '' });

  const load = () => listWithdrawals(status ? { status } : {}).then((res) => setWithdrawals(res.withdrawals));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (id) => {
    try {
      await approveWithdrawal(id);
      notifications.show({ title: 'Approved', message: 'Withdrawal approved', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const handlePay = async () => {
    try {
      await markPaid(payModal.id, payModal.txHash);
      notifications.show({ title: 'Paid', message: 'Withdrawal marked as paid', color: 'green' });
      setPayModal({ open: false, id: null, txHash: '' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const handleReject = async () => {
    try {
      await rejectWithdrawal(rejectModal.id, rejectModal.reason);
      notifications.show({ title: 'Rejected', message: 'Withdrawal rejected and refunded', color: 'orange' });
      setRejectModal({ open: false, id: null, reason: '' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>Withdrawals</Title>
      <Card withBorder radius="md" p="md">
        <Group mb="sm">
          <Select
            value={status}
            onChange={setStatus}
            data={['pending_otp', 'pending_approval', 'approved', 'rejected', 'paid']}
            clearable
            w={220}
          />
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Wallet Address</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {withdrawals.map((w) => (
              <Table.Tr key={w._id}>
                <Table.Td>
                  {w.user?.name}
                  <br />
                  <Text size="xs" c="dimmed">
                    {w.user?.email}
                  </Text>
                </Table.Td>
                <Table.Td>${w.amount.toFixed(2)}</Table.Td>
                <Table.Td>{w.walletAddress}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      w.status === 'paid'
                        ? 'green'
                        : w.status === 'rejected'
                          ? 'red'
                          : w.status === 'approved'
                            ? 'teal'
                            : 'yellow'
                    }
                  >
                    {w.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {w.status === 'pending_approval' && (
                      <>
                        <Button size="xs" color="green" onClick={() => handleApprove(w._id)}>
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => setRejectModal({ open: true, id: w._id, reason: '' })}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {w.status === 'approved' && (
                      <Button size="xs" onClick={() => setPayModal({ open: true, id: w._id, txHash: '' })}>
                        Mark Paid
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {withdrawals.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No records found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null, reason: '' })}
        title="Reject Withdrawal"
      >
        <Stack>
          <Textarea
            label="Reason"
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.currentTarget.value }))}
          />
          <Button color="red" onClick={handleReject}>
            Confirm Reject
          </Button>
        </Stack>
      </Modal>

      <Modal opened={payModal.open} onClose={() => setPayModal({ open: false, id: null, txHash: '' })} title="Mark Paid">
        <Stack>
          <TextInput
            label="Transaction Hash"
            value={payModal.txHash}
            onChange={(e) => setPayModal((prev) => ({ ...prev, txHash: e.currentTarget.value }))}
          />
          <Button onClick={handlePay}>Confirm Payment</Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
