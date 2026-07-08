import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Button, Group, Select, Stack, Text, Anchor, Modal, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listKyc, reviewKyc } from '../../services/kycService';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function KycAdminPage() {
  const [kycs, setKycs] = useState([]);
  const [status, setStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, remarks: '' });

  const load = () => listKyc(status ? { status } : {}).then((res) => setKycs(res.kycs));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (id) => {
    try {
      await reviewKyc(id, 'approved', '');
      notifications.show({ title: 'Approved', message: 'KYC approved', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const handleReject = async () => {
    try {
      await reviewKyc(rejectModal.id, 'rejected', rejectModal.remarks);
      notifications.show({ title: 'Rejected', message: 'KYC rejected', color: 'orange' });
      setRejectModal({ open: false, id: null, remarks: '' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>KYC Review</Title>
      <Card withBorder radius="md" p="md">
        <Group mb="sm">
          <Select
            value={status}
            onChange={setStatus}
            data={['pending', 'approved', 'rejected']}
            clearable
            w={200}
          />
        </Group>
        <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Aadhaar</Table.Th>
              <Table.Th>PAN</Table.Th>
              <Table.Th>Documents</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {kycs.map((k) => (
              <Table.Tr key={k._id}>
                <Table.Td>
                  {k.user?.name}
                  <br />
                  <Text size="xs" c="dimmed">
                    {k.user?.email}
                  </Text>
                </Table.Td>
                <Table.Td>{k.aadhaarNumber}</Table.Td>
                <Table.Td>{k.panNumber}</Table.Td>
                <Table.Td>
                  <Anchor href={`${API_ORIGIN}${k.aadhaarUrl}`} target="_blank" mr="sm">
                    Aadhaar
                  </Anchor>
                  <Anchor href={`${API_ORIGIN}${k.panUrl}`} target="_blank">
                    PAN
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Badge color={k.status === 'approved' ? 'green' : k.status === 'rejected' ? 'red' : 'yellow'}>
                    {k.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {k.status === 'pending' && (
                    <Group gap="xs">
                      <Button size="xs" color="green" onClick={() => handleApprove(k._id)}>
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => setRejectModal({ open: true, id: k._id, remarks: '' })}
                      >
                        Reject
                      </Button>
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {kycs.length === 0 && (
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
        onClose={() => setRejectModal({ open: false, id: null, remarks: '' })}
        title="Reject KYC"
      >
        <Stack>
          <Textarea
            label="Reason"
            value={rejectModal.remarks}
            onChange={(e) => {
              const { value } = e.currentTarget;
              setRejectModal((prev) => ({ ...prev, remarks: value }));
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
