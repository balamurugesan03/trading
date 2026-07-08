import { useEffect, useState } from 'react';
import { Card, Title, Stack, Group, ThemeIcon, Text, Center, Loader } from '@mantine/core';
import { IconBell, IconInbox } from '@tabler/icons-react';
import { myNotifications, markAllRead } from '../../services/notificationService';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    myNotifications('transactional')
      .then((res) => setItems(res.notifications))
      .finally(() => setLoading(false));
    markAllRead('transactional');
  }, []);

  return (
    <Stack>
      <Group gap="xs">
        <ThemeIcon size={34} radius="md" variant="light" color="blue">
          <IconBell size={19} />
        </ThemeIcon>
        <Title order={2}>Notifications</Title>
      </Group>

      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : items.length === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Center>
            <Stack align="center" gap={4}>
              <IconInbox size={28} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm">
                No notifications yet
              </Text>
            </Stack>
          </Center>
        </Card>
      ) : (
        <Stack gap="sm">
          {items.map((n) => (
            <Card
              key={n._id}
              withBorder
              radius="md"
              p="md"
              style={{
                borderLeft: n.read ? undefined : '3px solid var(--mantine-color-blue-5)',
                background: n.read ? undefined : 'rgba(47, 125, 251, 0.06)',
              }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Text fw={600} size="sm">
                    {n.title}
                  </Text>
                  <Text size="sm" c="dimmed" mt={2}>
                    {n.message}
                  </Text>
                </div>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
