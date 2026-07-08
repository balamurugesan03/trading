import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Title,
  Table,
  Badge,
  Button,
  Group,
  TextInput,
  PasswordInput,
  Select,
  Stack,
  Text,
  Modal,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLogin2 } from '@tabler/icons-react';
import {
  listUsers,
  suspendUser,
  activateUser,
  updateUser,
  resetPassword,
  impersonateUser,
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [passwordModal, setPasswordModal] = useState({ open: false, user: null });

  const editForm = useForm({ initialValues: { name: '', email: '', mobile: '' } });
  const passwordForm = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validate: {
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
    },
  });

  const load = () =>
    listUsers({ ...(search ? { search } : {}), ...(status ? { status } : {}) }).then((res) => setUsers(res.users));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  const handleImpersonate = async (user) => {
    try {
      const { token, user: targetUser } = await impersonateUser(user._id);
      impersonate(token, targetUser);
      notifications.show({
        title: 'Viewing as customer',
        message: `You're now viewing ${targetUser.name}'s dashboard. Use "Return to Admin" to come back.`,
        color: 'blue',
      });
      navigate('/');
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const openEdit = (user) => {
    editForm.setValues({ name: user.name, email: user.email, mobile: user.mobile });
    setEditModal({ open: true, user });
  };

  const handleEditSubmit = async (values) => {
    try {
      await updateUser(editModal.user._id, values);
      notifications.show({ title: 'Saved', message: 'Customer details updated', color: 'green' });
      setEditModal({ open: false, user: null });
      load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  const openPasswordReset = (user) => {
    passwordForm.reset();
    setPasswordModal({ open: true, user });
  };

  const handlePasswordSubmit = async (values) => {
    try {
      await resetPassword(passwordModal.user._id, values.password);
      notifications.show({ title: 'Saved', message: 'Password reset successfully', color: 'green' });
      setPasswordModal({ open: false, user: null });
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
          <Select
            value={status}
            onChange={(v) => setStatus(v || '')}
            data={['active', 'pending_activation', 'suspended']}
            placeholder="All statuses"
            clearable
            w={200}
          />
        </Group>
        <Table.ScrollContainer minWidth={900}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Mobile</Table.Th>
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
                <Table.Td>{u.mobile}</Table.Td>
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
                    <Button size="xs" variant="light" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    {u.role !== 'super_admin' && (
                      <Button
                        size="xs"
                        variant="light"
                        color="indigo"
                        leftSection={<IconLogin2 size={14} />}
                        onClick={() => handleImpersonate(u)}
                      >
                        Login as Customer
                      </Button>
                    )}
                    <Button size="xs" variant="light" color="grape" onClick={() => openPasswordReset(u)}>
                      Reset Password
                    </Button>
                    {u.status !== 'suspended' ? (
                      <Button size="xs" color="red" variant="light" onClick={() => handleAction('suspend', u._id)}>
                        Block
                      </Button>
                    ) : (
                      <Button size="xs" color="green" variant="light" onClick={() => handleAction('activate', u._id)}>
                        Unblock
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {users.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text c="dimmed">No users found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal
        opened={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        title="Edit Customer Details"
      >
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <Stack>
            <TextInput label="Name" required {...editForm.getInputProps('name')} />
            <TextInput label="Email" type="email" required {...editForm.getInputProps('email')} />
            <TextInput label="Mobile" required {...editForm.getInputProps('mobile')} />
            <Button type="submit">Save Changes</Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={passwordModal.open}
        onClose={() => setPasswordModal({ open: false, user: null })}
        title={`Reset Password${passwordModal.user ? ` — ${passwordModal.user.name}` : ''}`}
      >
        <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
          <Stack>
            <PasswordInput label="New Password" required {...passwordForm.getInputProps('password')} />
            <PasswordInput label="Confirm Password" required {...passwordForm.getInputProps('confirmPassword')} />
            <Button type="submit" color="grape">
              Reset Password
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
