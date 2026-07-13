import { useEffect, useState } from 'react';
import {
  Card,
  Title,
  NumberInput,
  TextInput,
  Button,
  Stack,
  Alert,
  Table,
  Badge,
  Text,
  Modal,
  Group,
  Grid,
  ThemeIcon,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconArrowDownCircle,
  IconWallet,
  IconShieldCheck,
  IconLockOpen,
  IconCash,
  IconInbox,
} from '@tabler/icons-react';
import { requestWithdrawal, verifyCaptcha, myWithdrawals } from '../../services/withdrawalService';
import { myWallet } from '../../services/walletService';
import glossy from '../../components/GlossyStatCard.module.css';
import PayoutCutoffBanner from '../../components/PayoutCutoffBanner';

const STEPS = [
  { icon: IconArrowDownCircle, text: 'Request a withdrawal with your amount and USDT wallet address' },
  { icon: IconShieldCheck, text: 'Solve a quick verification question to confirm the request is really you' },
  { icon: IconLockOpen, text: 'Admin approves and manually transfers the funds to your wallet' },
];

export default function WithdrawPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaModal, setCaptchaModal] = useState({ open: false, withdrawalId: null, question: '', answer: '' });

  const form = useForm({
    initialValues: { amount: 0, walletAddress: '' },
    validate: {
      amount: (v) => (v > 0 ? null : 'Enter a valid amount'),
      walletAddress: (v) => (v.trim().length > 0 ? null : 'Wallet address is required'),
    },
  });

  const loadWithdrawals = () => myWithdrawals().then((res) => setWithdrawals(res.withdrawals));
  const loadWallet = () => myWallet().then((res) => setAvailableBalance(res.wallet.withdrawalBalance));

  useEffect(() => {
    loadWithdrawals();
    loadWallet();
  }, []);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const { withdrawalId, captchaQuestion } = await requestWithdrawal(values);
      setCaptchaModal({ open: true, withdrawalId, question: captchaQuestion, answer: '' });
      form.reset();
      loadWithdrawals();
      loadWallet();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCaptcha = async () => {
    try {
      await verifyCaptcha(captchaModal.withdrawalId, captchaModal.answer);
      notifications.show({ title: 'Verified', message: 'Withdrawal sent for admin approval', color: 'green' });
      setCaptchaModal({ open: false, withdrawalId: null, question: '', answer: '' });
      loadWithdrawals();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Incorrect answer',
        color: 'red',
      });
    }
  };

  return (
    <Stack>
      <Group gap="xs">
        <ThemeIcon size={34} radius="md" variant="light" color="teal">
          <IconArrowDownCircle size={19} />
        </ThemeIcon>
        <Title order={2}>Withdraw</Title>
      </Group>

      <PayoutCutoffBanner />

      <Card p="lg" className={`${glossy.card} ${glossy.teal}`}>
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" className={glossy.label} mb={4}>
              Available to Withdraw
            </Text>
            <Text size="28px" fw={700} className={glossy.value}>
              ${Number(availableBalance).toFixed(2)}
            </Text>
          </div>
          <ThemeIcon size={48} radius="xl" variant="white" color="teal">
            <IconWallet size={24} />
          </ThemeIcon>
        </Group>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card p="lg" h="100%">
            <Title order={4} mb="md">
              New Withdrawal Request
            </Title>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                {error && <Alert color="red">{error}</Alert>}
                <NumberInput
                  label="Amount (USD)"
                  leftSection={<IconCash size={16} />}
                  min={0}
                  decimalScale={2}
                  {...form.getInputProps('amount')}
                />
                <TextInput
                  label="Wallet Address (USDT)"
                  leftSection={<IconWallet size={16} />}
                  {...form.getInputProps('walletAddress')}
                />
                <Button type="submit" loading={loading} size="md" mt="xs">
                  Request Withdrawal
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card p="lg" h="100%">
            <Title order={4} mb="md">
              How Withdrawals Work
            </Title>
            <Stack gap="md">
              {STEPS.map((step, i) => (
                <Group key={i} align="flex-start" wrap="nowrap" gap="sm">
                  <ThemeIcon size={30} radius="xl" variant="light" color="teal">
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
          Withdrawal History
        </Title>
        <Table.ScrollContainer minWidth={750}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Wallet Address</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Payout Cycle</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {withdrawals.map((w) => (
              <Table.Tr key={w._id}>
                <Table.Td>${w.amount.toFixed(2)}</Table.Td>
                <Table.Td>{w.walletAddress}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      w.status === 'paid'
                        ? 'green'
                        : w.status === 'rejected'
                          ? 'red'
                          : w.status === 'processing'
                            ? 'blue'
                            : w.status === 'approved'
                              ? 'teal'
                              : 'yellow'
                    }
                  >
                    {w.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {w.payoutCycleDate ? (
                    <Badge variant="light" color={w.cutoffBucket === 'after_cutoff' ? 'orange' : 'gray'}>
                      {w.payoutCycleDate}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </Table.Td>
                <Table.Td>{new Date(w.createdAt).toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
            {withdrawals.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Center py="lg">
                    <Stack align="center" gap={4}>
                      <IconInbox size={28} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" size="sm">
                        No withdrawals yet
                      </Text>
                    </Stack>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal
        opened={captchaModal.open}
        onClose={() => setCaptchaModal({ open: false, withdrawalId: null, question: '', answer: '' })}
        title="Verify You're Human"
        centered
      >
        <Stack align="center">
          <ThemeIcon size={56} radius="xl" variant="light" color="teal">
            <IconShieldCheck size={28} />
          </ThemeIcon>
          <Text size="sm" c="dimmed" ta="center">
            Solve this to confirm your withdrawal request.
          </Text>
          <Text size="xl" fw={700}>
            {captchaModal.question} = ?
          </Text>
          <TextInput
            w="100%"
            ta="center"
            size="lg"
            styles={{ input: { textAlign: 'center', letterSpacing: 6, fontWeight: 700 } }}
            placeholder="Answer"
            value={captchaModal.answer}
            onChange={(e) => {
              const { value } = e.currentTarget;
              setCaptchaModal((prev) => ({ ...prev, answer: value }));
            }}
          />
          <Button fullWidth onClick={handleVerifyCaptcha}>
            Verify
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
