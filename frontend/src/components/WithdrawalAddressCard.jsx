import { useState } from 'react';
import { Card, Title, Text, Group, Button, Modal, Stack, TextInput, PasswordInput, Alert, Code, ThemeIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconWallet, IconPencil, IconShieldLock } from '@tabler/icons-react';
import { updateWithdrawalAddress } from '../services/walletService';

// Shows the customer's saved USDT withdrawal address and lets them set or change it.
// Changing an existing address asks for the account password (enforced server-side too).
export default function WithdrawalAddressCard({ address, updatedAt, onSaved }) {
  const [open, setOpen] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isChange = Boolean(address);

  const openModal = () => {
    setNewAddress('');
    setPassword('');
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await updateWithdrawalAddress(newAddress.trim(), password);
      notifications.show({ title: 'Saved', message: 'Withdrawal address updated', color: 'green' });
      setOpen(false);
      onSaved?.(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group align="flex-start" wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
          <ThemeIcon size={36} radius="md" variant="light" color="teal">
            <IconWallet size={20} />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Title order={4}>Withdrawal Address (USDT)</Title>
            {address ? (
              <>
                <Code block mt={6} style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                  {address}
                </Code>
                <Text size="xs" c="dimmed" mt={4}>
                  All withdrawals, including daily automatic payouts, are sent here.
                  {updatedAt ? ` Last updated ${new Date(updatedAt).toLocaleString()}.` : ''}
                </Text>
              </>
            ) : (
              <Text size="sm" c="dimmed" mt={4}>
                No address saved yet. Add one now, or it will be saved from your first withdrawal request.
              </Text>
            )}
          </div>
        </Group>
        <Button variant="light" leftSection={<IconPencil size={14} />} onClick={openModal} style={{ flexShrink: 0 }}>
          {isChange ? 'Change' : 'Add'}
        </Button>
      </Group>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={isChange ? 'Change Withdrawal Address' : 'Add Withdrawal Address'}
        centered
      >
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          {isChange && (
            <Alert color="yellow" icon={<IconShieldLock size={16} />}>
              All future withdrawals will be sent to the new address. Double-check it - payouts to a wrong
              address cannot be reversed.
            </Alert>
          )}
          <TextInput
            label="New Wallet Address (USDT)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.currentTarget.value)}
            data-autofocus
          />
          {isChange && (
            <PasswordInput
              label="Account Password"
              description="Required to confirm the change"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          )}
          <Button onClick={handleSave} loading={saving} disabled={!newAddress.trim()}>
            Save Address
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
}
