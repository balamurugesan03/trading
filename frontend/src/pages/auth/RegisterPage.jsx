import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Stack, Text, Alert, Title, SimpleGrid, Group, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { IconUser, IconPhone, IconMail, IconLock, IconTicket, IconUserPlus, IconUserCheck, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { getSponsorByCode } from '../../services/authService';
import AuthLayout from '../../layouts/AuthLayout';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sponsor, setSponsor] = useState(null);
  const [sponsorError, setSponsorError] = useState('');
  const [sponsorChecking, setSponsorChecking] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      mobile: '',
      email: '',
      password: '',
      sponsorCode: searchParams.get('ref') || '',
    },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
      mobile: (v) => (v.trim().length >= 8 ? null : 'Enter a valid mobile number'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
      sponsorCode: (v) => (v.trim().length > 0 ? null : 'Sponsor/referral code is required'),
    },
  });

  const [debouncedSponsorCode] = useDebouncedValue(form.values.sponsorCode, 400);

  useEffect(() => {
    const code = debouncedSponsorCode.trim();
    if (!code) {
      setSponsor(null);
      setSponsorError('');
      return;
    }
    let cancelled = false;
    setSponsorChecking(true);
    getSponsorByCode(code)
      .then((res) => {
        if (cancelled) return;
        setSponsor(res.sponsor);
        setSponsorError('');
      })
      .catch(() => {
        if (cancelled) return;
        setSponsor(null);
        setSponsorError('No account found with that sponsor/referral code');
      })
      .finally(() => {
        if (!cancelled) setSponsorChecking(false);
      });
    // eslint-disable-next-line consistent-return
    return () => {
      cancelled = true;
    };
  }, [debouncedSponsorCode]);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      await register(values);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Start investing today"
      subtitle="Create your account with a sponsor's referral code to unlock daily ROI and network income."
    >
      <Stack gap={4} mb="xl">
        <Title order={2}>Create Account</Title>
        <Text c="dimmed" size="sm">
          Fill in your details to get started
        </Text>
      </Stack>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <SimpleGrid cols={2}>
            <TextInput label="Full Name" leftSection={<IconUser size={16} />} required {...form.getInputProps('name')} />
            <TextInput
              label="Mobile Number"
              leftSection={<IconPhone size={16} />}
              required
              {...form.getInputProps('mobile')}
            />
          </SimpleGrid>
          <TextInput
            label="Email"
            leftSection={<IconMail size={16} />}
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            leftSection={<IconLock size={16} />}
            required
            {...form.getInputProps('password')}
          />
          <div>
            <TextInput
              label="Sponsor / Referral Code"
              leftSection={<IconTicket size={16} />}
              rightSection={sponsorChecking ? <Loader size={14} /> : null}
              required
              description="Provided by the person who invited you"
              {...form.getInputProps('sponsorCode')}
            />
            {!sponsorChecking && sponsor && (
              <Group gap={6} mt={6}>
                <IconUserCheck size={15} color="var(--mantine-color-green-5)" />
                <Text size="xs" c={sponsor.active ? 'green' : 'yellow'}>
                  Sponsor: <strong>{sponsor.name}</strong>
                  {!sponsor.active && ' — this account is not active yet and cannot refer new users'}
                </Text>
              </Group>
            )}
            {!sponsorChecking && !sponsor && sponsorError && (
              <Group gap={6} mt={6}>
                <IconAlertCircle size={15} color="var(--mantine-color-red-5)" />
                <Text size="xs" c="red">
                  {sponsorError}
                </Text>
              </Group>
            )}
          </div>
          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="md"
            mt="xs"
            leftSection={<IconUserPlus size={18} />}
          >
            Register
          </Button>
          <Text size="sm" ta="center" c="dimmed">
            Already have an account?{' '}
            <Text component={Link} to="/login" fw={600} c="velocity" span>
              Login
            </Text>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
