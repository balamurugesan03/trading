import { useEffect, useState } from 'react';
import {
  Card,
  Title,
  TextInput,
  FileInput,
  Button,
  Stack,
  Alert,
  Text,
  Group,
  Grid,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconShieldCheck,
  IconClock,
  IconX,
  IconId,
  IconCreditCard,
  IconLock,
  IconEye,
  IconBolt,
} from '@tabler/icons-react';
import { submitKyc, myKyc } from '../../services/kycService';
import glossy from '../../components/GlossyStatCard.module.css';

const STATUS_META = {
  pending: { color: 'orange', icon: IconClock, title: 'Verification Pending', text: 'Your documents are under review by our team.' },
  approved: { color: 'green', icon: IconShieldCheck, title: 'Verified', text: 'Your identity has been successfully verified.' },
  rejected: { color: 'red', icon: IconX, title: 'Verification Rejected', text: 'Please review the remarks and resubmit your documents.' },
};

const REASONS = [
  { icon: IconLock, text: 'Protects your account and withdrawals from fraud' },
  { icon: IconEye, text: 'Documents are only visible to the admin review team' },
  { icon: IconBolt, text: 'Approved KYC speeds up future withdrawal processing' },
];

export default function KycPage() {
  const [kyc, setKyc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { aadhaarNumber: '', panNumber: '', aadhaar: null, pan: null },
    validate: {
      aadhaarNumber: (v) => (v.trim().length > 0 ? null : 'Aadhaar number is required'),
      panNumber: (v) => (v.trim().length > 0 ? null : 'PAN number is required'),
      aadhaar: (v) => (v ? null : 'Aadhaar document is required'),
      pan: (v) => (v ? null : 'PAN document is required'),
    },
  });

  const load = () => myKyc().then((res) => setKyc(res.kyc));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaarNumber', values.aadhaarNumber);
      formData.append('panNumber', values.panNumber);
      formData.append('aadhaar', values.aadhaar);
      formData.append('pan', values.pan);
      await submitKyc(formData);
      notifications.show({ title: 'Submitted', message: 'KYC submitted for review', color: 'green' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  const statusMeta = kyc ? STATUS_META[kyc.status] : null;
  const glossyColor = { pending: 'orange', approved: 'green', rejected: 'red' }[kyc?.status] || 'dark';

  return (
    <Stack>
      <Group gap="xs">
        <ThemeIcon size={34} radius="md" variant="light" color="grape">
          <IconShieldCheck size={19} />
        </ThemeIcon>
        <Title order={2}>KYC Verification</Title>
      </Group>

      {kyc ? (
        <Card p="lg" className={`${glossy.card} ${glossy[glossyColor]}`}>
          <Group justify="space-between" align="center" wrap="wrap">
            <div>
              <Text size="sm" className={glossy.label} mb={4}>
                {statusMeta.title}
              </Text>
              <Text size="lg" fw={600} className={glossy.value}>
                {statusMeta.text}
              </Text>
              {kyc.remarks && (
                <Text size="sm" mt={6} className={glossy.label}>
                  Remarks: {kyc.remarks}
                </Text>
              )}
            </div>
            <ThemeIcon size={48} radius="xl" variant="white" color={glossyColor}>
              <statusMeta.icon size={24} />
            </ThemeIcon>
          </Group>
        </Card>
      ) : (
        <Card p="lg" className={`${glossy.card} ${glossy.dark}`}>
          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" className={glossy.label} mb={4}>
                Not Submitted
              </Text>
              <Text size="lg" fw={600} className={glossy.value}>
                Complete your KYC to unlock faster withdrawals
              </Text>
            </div>
            <ThemeIcon size={48} radius="xl" variant="white" color="dark">
              <IconShieldCheck size={24} />
            </ThemeIcon>
          </Group>
        </Card>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card p="lg" h="100%">
            <Title order={4} mb="xs">
              Identity Documents
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Submit clear photos or scans of your Aadhaar and PAN
            </Text>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                {error && <Alert color="red">{error}</Alert>}

                <Text size="sm" fw={600}>
                  Aadhaar
                </Text>
                <TextInput
                  label="Aadhaar Number"
                  leftSection={<IconId size={16} />}
                  {...form.getInputProps('aadhaarNumber')}
                />
                <FileInput
                  label="Aadhaar Document"
                  placeholder="Upload photo or PDF"
                  leftSection={<IconUpload size={16} />}
                  accept="image/png,image/jpeg,application/pdf"
                  {...form.getInputProps('aadhaar')}
                />

                <Divider my="xs" />

                <Text size="sm" fw={600}>
                  PAN
                </Text>
                <TextInput
                  label="PAN Number"
                  leftSection={<IconCreditCard size={16} />}
                  {...form.getInputProps('panNumber')}
                />
                <FileInput
                  label="PAN Document"
                  placeholder="Upload photo or PDF"
                  leftSection={<IconUpload size={16} />}
                  accept="image/png,image/jpeg,application/pdf"
                  {...form.getInputProps('pan')}
                />

                <Button type="submit" loading={loading} size="md" mt="xs">
                  Submit KYC
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card p="lg" h="100%">
            <Title order={4} mb="md">
              Why We Verify
            </Title>
            <Stack gap="md">
              {REASONS.map((r, i) => (
                <Group key={i} align="flex-start" wrap="nowrap" gap="sm">
                  <ThemeIcon size={30} radius="xl" variant="light" color="grape">
                    <r.icon size={16} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed" pt={4}>
                    {r.text}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
