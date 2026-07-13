import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Button, Group, Select, Stack, Text, Modal, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  listWithdrawals,
  approveWithdrawal,
  startProcessing,
  markPaid,
  rejectWithdrawal,
} from '../../services/withdrawalService';

const STATUS_OPTIONS = [
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Completed' },
];

const CUTOFF_OPTIONS = [
  { value: 'before_cutoff', label: 'Before Cut-Off' },
  { value: 'after_cutoff', label: 'After Cut-Off' },
];

export default function WithdrawalsAdminPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState('pending_approval');
  const [cutoffBucket, setCutoffBucket] = useState('');
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [payModal, setPayModal] = useState({ open: false, id: null, txHash: '' });

  const load = () =>
    listWithdrawals({ ...(status ? { status } : {}), ...(cutoffBucket ? { cutoffBucket } : {}) }).then((res) =>
      setWithdrawals(res.withdrawals)
    );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, cutoffBucket]);

  const handleApprove = async (id) => {
    try {
      await approveWithdrawal(id);
      notifications.show({ title: 'Approved', message: 'Withdrawal approved', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const handleStartProcessing = async (id) => {
    try {
      await startProcessing(id);
      notifications.show({ title: 'Processing', message: 'Withdrawal moved to processing', color: 'blue' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const handlePay = async () => {
    try {
      await markPaid(payModal.id, payModal.txHash);
      notifications.show({ title: 'Completed', message: 'Withdrawal marked as paid', color: 'green' });
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
            onChange={(v) => setStatus(v || '')}
            data={STATUS_OPTIONS}
            placeholder="All statuses"
            clearable
            w={220}
          />
          <Select
            value={cutoffBucket}
            onChange={(v) => setCutoffBucket(v || '')}
            data={CUTOFF_OPTIONS}
            placeholder="All payout cycles"
            clearable
            w={220}
          />
        </Group>
        <Table.ScrollContainer minWidth={850}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Wallet Address</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Payout Cycle</Table.Th>
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
                          : w.status === 'processing'
                            ? 'blue'
                            : w.status === 'approved'
                              ? 'teal'
                              : 'yellow'
                    }
                  >
                    {STATUS_OPTIONS.find((o) => o.value === w.status)?.label || w.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {w.payoutCycleDate ? (
                    <Badge variant="light" color={w.cutoffBucket === 'after_cutoff' ? 'orange' : 'gray'}>
                      {w.cutoffBucket === 'after_cutoff' ? 'After Cut-Off · ' : 'Before Cut-Off · '}
                      {w.payoutCycleDate}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {w.status === 'pending_verification' && (
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
                          Cancel
                        </Button>
                      </>
                    )}
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
                      <Button size="xs" color="blue" onClick={() => handleStartProcessing(w._id)}>
                        Start Processing
                      </Button>
                    )}
                    {w.status === 'processing' && (
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
        title="Reject Withdrawal"
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

      <Modal opened={payModal.open} onClose={() => setPayModal({ open: false, id: null, txHash: '' })} title="Mark Paid">
        <Stack>
          <TextInput
            label="Transaction Hash"
            value={payModal.txHash}
            onChange={(e) => {
              const { value } = e.currentTarget;
              setPayModal((prev) => ({ ...prev, txHash: value }));
            }}
          />
          <Button onClick={handlePay}>Confirm Payment</Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
