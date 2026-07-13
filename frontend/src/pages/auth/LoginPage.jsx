import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Stack, Text, Alert, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconId, IconLock, IconLogin2 } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { identifier: '', password: '' },
    validate: {
      identifier: (v) => (v.trim().length > 0 ? null : 'Enter your email or Customer ID'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  });

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(values);
      navigate(user.role === 'super_admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to track your investments, daily ROI, referral income, and wallets in one dashboard."
    >
      <Stack gap={4} mb="xl">
        <Title order={2}>Sign In</Title>
        <Text c="dimmed" size="sm">
          Enter your credentials to access your account
        </Text>
      </Stack>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput
            label="Email or Customer ID"
            placeholder="you@example.com or A1B2C3D4"
            leftSection={<IconId size={16} />}
            required
            {...form.getInputProps('identifier')}
          />
          <PasswordInput
            label="Password"
            leftSection={<IconLock size={16} />}
            required
            {...form.getInputProps('password')}
          />
          <Button type="submit" loading={loading} fullWidth size="md" mt="xs" leftSection={<IconLogin2 size={18} />}>
            Login
          </Button>
          <Text size="sm" ta="center" c="dimmed">
            Don&apos;t have an account?{' '}
            <Text component={Link} to="/register" fw={600} c="velocity" span>
              Register
            </Text>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
