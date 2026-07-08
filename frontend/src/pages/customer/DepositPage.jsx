import { useEffect, useState } from 'react';
import {
  Card,
  Title,
  TextInput,
  FileInput,
  Button,
  Stack,
  Alert,
  Table,
  Badge,
  Text,
  CopyButton,
  Group,
  Grid,
  ThemeIcon,
  Center,
  SimpleGrid,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconCopy,
  IconCheck,
  IconCash,
  IconWallet,
  IconBox,
  IconHash,
  IconPhoto,
  IconClipboardList,
  IconInbox,
} from '@tabler/icons-react';
import { listPackages } from '../../services/packageService';
import { createDeposit, myDeposits } from '../../services/depositService';
import { getSettings } from '../../services/settingService';
import glossy from '../../components/GlossyStatCard.module.css';
import companyWalletQr from '../../assets/company-wallet-qr.jpeg';

const STEPS = [
  { icon: IconWallet, text: 'Scan the QR code or copy the company wallet address' },
  { icon: IconBox, text: 'Choose a fixed deposit package amount — no manual amount entry' },
  { icon: IconPhoto, text: 'Upload the payment screenshot and transaction reference' },
  { icon: IconClipboardList, text: 'Admin verifies and approves — your investment activates and ROI starts 24h later' },
];

// Fixed package tiers customers can pick from. Keep in sync with
// backend/src/constants/depositAmounts.js — the server independently
// enforces this same list so a request can never carry a mismatched amount.
const DEPOSIT_AMOUNTS = [100, 200, 500, 1000, 5000, 10000];

export default function DepositPage() {
  const [packages, setPackages] = useState([]);
  const [companyWallet, setCompanyWallet] = useState('');
  const [deposits, setDeposits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { amount: 0, txReference: '', screenshot: null },
    validate: {
      amount: (v) => (DEPOSIT_AMOUNTS.includes(v) ? null : 'Select a package amount'),
      txReference: (v) => (v.trim().length > 0 ? null : 'Transaction reference is required'),
      screenshot: (v) => (v ? null : 'Deposit screenshot is required'),
    },
  });

  const loadDeposits = () => myDeposits().then((res) => setDeposits(res.deposits));

  useEffect(() => {
    listPackages().then((res) => setPackages(res.packages));
    getSettings()
      .then((res) => setCompanyWallet(res.settings.companyWalletAddress))
      .catch(() => {});
    loadDeposits();
  }, []);

  // A package amount is only selectable if an active package's range actually covers it —
  // the same rule the server enforces — so a customer can never submit an amount the admin can't process.
  const isAmountAvailable = (amount) =>
    packages.some((p) => p.active && amount >= p.minAmount && amount <= p.maxAmount);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount', values.amount);
      formData.append('txReference', values.txReference);
      formData.append('screenshot', values.screenshot);
      await createDeposit(formData);
      notifications.show({ title: 'Success', message: 'Deposit request submitted for review', color: 'green' });
      form.reset();
      loadDeposits();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Group gap="xs">
        <ThemeIcon size={34} radius="md" variant="light" color="indigo">
          <IconCash size={19} />
        </ThemeIcon>
        <Title order={2}>Deposit</Title>
      </Group>

      <Card p="lg" className={`${glossy.card} ${glossy.blue}`}>
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Text size="sm" className={glossy.label} mb={6}>
              Company Deposit Wallet Address (USDT · BEP20 - BNB Smart Chain)
            </Text>
            <Text ff="monospace" fw={600} size="lg" className={glossy.value} mb="sm">
              {companyWallet || 'Not configured yet'}
            </Text>
            {companyWallet && (
              <CopyButton value={companyWallet}>
                {({ copied, copy }) => (
                  <Button
                    variant="white"
                    color={copied ? 'teal' : 'blue'}
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={copy}
                  >
                    {copied ? 'Copied' : 'Copy Address'}
                  </Button>
                )}
              </CopyButton>
            )}
          </div>
          {companyWallet && (
            <Center p="sm" bg="white" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <img
                src={companyWalletQr}
                alt="Company deposit wallet QR code"
                style={{ width: 140, height: 140, display: 'block' }}
              />
            </Center>
          )}
        </Group>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card p="lg" h="100%">
            <Title order={4} mb="md">
              New Deposit Request
            </Title>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                {error && <Alert color="red">{error}</Alert>}
                <div>
                  <Text size="sm" fw={500} mb={6}>
                    Package Amount (USD)
                  </Text>
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                    {DEPOSIT_AMOUNTS.map((amt) => {
                      const selected = form.values.amount === amt;
                      const available = isAmountAvailable(amt);
                      return (
                        <UnstyledButton
                          key={amt}
                          disabled={!available}
                          onClick={() => available && form.setFieldValue('amount', amt)}
                          p="sm"
                          style={{
                            borderRadius: 'var(--mantine-radius-md)',
                            border: `1px solid var(--mantine-color-${selected ? 'indigo-6' : 'gray-4'})`,
                            background: selected ? 'var(--mantine-color-indigo-light)' : 'transparent',
                            opacity: available ? 1 : 0.4,
                            cursor: available ? 'pointer' : 'not-allowed',
                            textAlign: 'center',
                          }}
                        >
                          <Text fw={700}>${amt.toLocaleString()}</Text>
                        </UnstyledButton>
                      );
                    })}
                  </SimpleGrid>
                  {form.errors.amount && (
                    <Text size="xs" c="red" mt={4}>
                      {form.errors.amount}
                    </Text>
                  )}
                </div>
                <TextInput
                  label="Transaction Reference"
                  leftSection={<IconHash size={16} />}
                  {...form.getInputProps('txReference')}
                />
                <FileInput
                  label="Deposit Screenshot"
                  placeholder="Upload screenshot"
                  leftSection={<IconUpload size={16} />}
                  accept="image/png,image/jpeg"
                  {...form.getInputProps('screenshot')}
                />
                <Button type="submit" loading={loading} size="md" mt="xs">
                  Submit Deposit Request
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card p="lg" h="100%">
            <Title order={4} mb="md">
              How It Works
            </Title>
            <Stack gap="md">
              {STEPS.map((step, i) => (
                <Group key={i} align="flex-start" wrap="nowrap" gap="sm">
                  <ThemeIcon size={30} radius="xl" variant="light" color="indigo">
                    <step.icon size={16} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed" pt={4}>
                    {step.text}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card p="lg">
        <Title order={4} mb="sm">
          Deposit History
        </Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Reference</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {deposits.map((d) => (
              <Table.Tr key={d._id}>
                <Table.Td>${d.amount.toFixed(2)}</Table.Td>
                <Table.Td>{d.txReference}</Table.Td>
                <Table.Td>
                  <Badge color={d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : 'yellow'}>
                    {d.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(d.createdAt).toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
            {deposits.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Center py="lg">
                    <Stack align="center" gap={4}>
                      <IconInbox size={28} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" size="sm">
                        No deposits yet
                      </Text>
                    </Stack>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
