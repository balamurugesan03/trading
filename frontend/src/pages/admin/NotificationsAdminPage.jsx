import { useEffect, useState } from 'react';
import { Card, Title, Table, Text, Stack, Button, Modal, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { listNotifications, createNotification } from '../../services/notificationService';

export default function NotificationsAdminPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const form = useForm({ initialValues: { title: '', message: '' } });

  const load = () => listNotifications().then((res) => setItems(res.notifications));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createNotification(values);
      notifications.show({ title: 'Sent', message: 'Notification broadcast to all users', color: 'green' });
      setModalOpen(false);
      form.reset();
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Notifications
        <Button onClick={() => setModalOpen(true)}>New Notification</Button>
      </Title>

      <Card withBorder radius="md" p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Message</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((n) => (
              <Table.Tr key={n._id}>
                <Table.Td>{n.title}</Table.Td>
                <Table.Td>{n.message}</Table.Td>
                <Table.Td>{new Date(n.createdAt).toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
            {items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed">No notifications yet</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="New Notification">
        <form onSubmit={form.onSubmit(handleCreate)}>
          <Stack>
            <TextInput label="Title" required {...form.getInputProps('title')} />
            <Textarea label="Message" required {...form.getInputProps('message')} />
            <Button type="submit">Broadcast</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
