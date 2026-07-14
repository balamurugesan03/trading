import { useEffect, useState } from 'react';
import { Card, Title, NumberInput, Button, Stack, Table, Text, Group, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { setTodayRoiRate, listRoiRates } from '../../services/settingService';

export default function RoiSettingsPage() {
  const [percentage, setPercentage] = useState(1);
  const [rates, setRates] = useState([]);

  const load = () => listRoiRates().then((res) => setRates(res.rates));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async () => {
    try {
      await setTodayRoiRate(percentage);
      notifications.show({ title: 'Saved', message: "Today's ROI rate updated", color: 'green' });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>ROI Settings</Title>
      <Card withBorder radius="md" p="md">
        <Group align="flex-end">
          <NumberInput
            label="Today's ROI %"
            value={percentage}
            onChange={setPercentage}
            min={0}
            max={100}
            decimalScale={2}
            w={200}
          />
          <Button onClick={handleSubmit}>Set Rate</Button>
        </Group>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Rate History
        </Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Percentage</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rates.map((r) => (
              <Table.Tr key={r._id}>
                <Table.Td>{r.date}</Table.Td>
                <Table.Td>{r.percentage}%</Table.Td>
                <Table.Td>
                  {r.locked ? (
                    <Badge color="gray">Locked - cycle ran</Badge>
                  ) : r.edited ? (
                    <Badge color="orange">Locked - already edited today</Badge>
                  ) : (
                    <Badge color="green">Open - editable</Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {rates.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed">No rates set yet</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
