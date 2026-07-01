import { useEffect, useState } from 'react';
import { Card, Title, Table, Button, Group, Stack, Text, Modal, TextInput, NumberInput, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { listPackages, createPackage, updatePackage } from '../../services/packageService';

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const form = useForm({
    initialValues: { name: '', minAmount: 0, maxAmount: 0, description: '' },
  });

  const load = () => listPackages().then((res) => setPackages(res.packages));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createPackage(values);
      notifications.show({ title: 'Created', message: 'Package created', color: 'green' });
      setModalOpen(false);
      form.reset();
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const toggleActive = async (pkg) => {
    try {
      await updatePackage(pkg._id, { active: !pkg.active });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Packages</Title>
        <Button onClick={() => setModalOpen(true)}>New Package</Button>
      </Group>
      <Card withBorder radius="md" p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Min Amount</Table.Th>
              <Table.Th>Max Amount</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Active</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {packages.map((p) => (
              <Table.Tr key={p._id}>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td>${p.minAmount.toFixed(2)}</Table.Td>
                <Table.Td>${p.maxAmount.toFixed(2)}</Table.Td>
                <Table.Td>{p.description}</Table.Td>
                <Table.Td>
                  <Switch checked={p.active} onChange={() => toggleActive(p)} />
                </Table.Td>
              </Table.Tr>
            ))}
            {packages.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No packages yet</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="New Package">
        <form onSubmit={form.onSubmit(handleCreate)}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <NumberInput label="Min Amount" min={0} required {...form.getInputProps('minAmount')} />
            <NumberInput label="Max Amount" min={0} required {...form.getInputProps('maxAmount')} />
            <TextInput label="Description" {...form.getInputProps('description')} />
            <Button type="submit">Create</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
