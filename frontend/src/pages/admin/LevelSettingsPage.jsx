import { useEffect, useState } from 'react';
import { Card, Title, NumberInput, TextInput, Button, Stack, SimpleGrid, Text, Switch, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getSettings, updateSettings } from '../../services/settingService';

export default function LevelSettingsPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then((res) => setSettings(res.settings));
  }, []);

  if (!settings) return null;

  const handleSave = async () => {
    try {
      await updateSettings({
        referralBonusPercentage: settings.referralBonusPercentage,
        levelIncomeCascadePercentage: settings.levelIncomeCascadePercentage,
        levelIncomeCapPercentage: settings.levelIncomeCapPercentage,
        investmentCapMultiplier: settings.investmentCapMultiplier,
        roiStartDelayHours: settings.roiStartDelayHours,
        companyWalletAddress: settings.companyWalletAddress,
        payoutCutoffTime: settings.payoutCutoffTime,
        roiDistributionEnabled: settings.roiDistributionEnabled,
        levelDistributionEnabled: settings.levelDistributionEnabled,
        incentiveDistributionEnabled: settings.incentiveDistributionEnabled,
      });
      notifications.show({ title: 'Saved', message: 'Settings updated', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message, color: 'red' });
    }
  };

  return (
    <Stack>
      <Title order={2}>Referral & Level Settings</Title>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Referral Bonus
        </Title>
        <Text size="sm" c="dimmed" mb="xs">
          Instant bonus paid to the direct sponsor when a deposit is approved. Default is 5%.
        </Text>
        <Group align="flex-end">
          <NumberInput
            label="Instant Referral Bonus %"
            value={settings.referralBonusPercentage}
            onChange={(v) => setSettings({ ...settings, referralBonusPercentage: v })}
            min={0}
            max={100}
            w={200}
          />
          <Button.Group>
            {[5, 10, 15].map((pct) => (
              <Button
                key={pct}
                variant={settings.referralBonusPercentage === pct ? 'filled' : 'default'}
                onClick={() => setSettings({ ...settings, referralBonusPercentage: pct })}
              >
                {pct}%
              </Button>
            ))}
          </Button.Group>
        </Group>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Level Income (cascading, unlimited levels)
        </Title>
        <Text size="sm" c="dimmed" mb="xs">
          Each level earns this % of the level above it&apos;s amount - level 1 earns this % of the
          downline&apos;s daily ROI, level 2 earns this % of level 1&apos;s amount, and so on up the
          entire upline chain (at the default 50%: L1=50% of ROI, L2=25%, L3=12.5%, ...).
        </Text>
        <NumberInput
          label="Cascade % per level"
          value={settings.levelIncomeCascadePercentage}
          onChange={(v) => setSettings({ ...settings, levelIncomeCascadePercentage: v })}
          min={0}
          max={100}
          w={220}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Per-Leader Level Income Cap
        </Title>
        <Text size="sm" c="dimmed" mb="xs">
          Maximum total level income any single leader can earn from one downline&apos;s investment,
          as a % of that investment&apos;s amount. Once a leader hits this cap for a given investment,
          their payouts from it stop automatically - the investor&apos;s own ROI is unaffected and
          keeps running until their own 2x cap.
        </Text>
        <NumberInput
          label="Cap % of investment"
          value={settings.levelIncomeCapPercentage}
          onChange={(v) => setSettings({ ...settings, levelIncomeCapPercentage: v })}
          min={0}
          max={100}
          w={220}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Company Deposit Wallet
        </Title>
        <Text size="sm" c="dimmed" mb="xs">
          USDT (BEP20 - BNB Smart Chain) address shown to customers on the Deposit page. Deposit
          requests cannot be submitted until this is set.
        </Text>
        <TextInput
          label="Company Wallet Address"
          placeholder="0x..."
          value={settings.companyWalletAddress}
          onChange={(e) => setSettings({ ...settings, companyWalletAddress: e.currentTarget.value })}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Daily Payout Cut-Off Time
        </Title>
        <Text size="sm" c="dimmed" mb="xs">
          Withdrawal requests submitted before this time (server time) are eligible for today&apos;s
          payout cycle. Requests submitted after it are automatically queued for the next day&apos;s
          cycle.
        </Text>
        <TextInput
          label="Cut-Off Time"
          type="time"
          value={settings.payoutCutoffTime}
          onChange={(e) => setSettings({ ...settings, payoutCutoffTime: e.currentTarget.value })}
          w={200}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Investment Rules
        </Title>
        <SimpleGrid cols={2}>
          <NumberInput
            label="Investment Cap Multiplier (x capital)"
            value={settings.investmentCapMultiplier}
            onChange={(v) => setSettings({ ...settings, investmentCapMultiplier: v })}
            min={1}
          />
          <NumberInput
            label="ROI Start Delay (hours)"
            value={settings.roiStartDelayHours}
            onChange={(v) => setSettings({ ...settings, roiStartDelayHours: v })}
            min={0}
          />
        </SimpleGrid>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Distribution Controls
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          Temporarily pause a payout category without stopping the rest of the platform.
        </Text>
        <Group>
          <Switch
            label="ROI Distribution"
            checked={settings.roiDistributionEnabled}
            onChange={(e) => setSettings({ ...settings, roiDistributionEnabled: e.currentTarget.checked })}
          />
          <Switch
            label="Level Income Distribution"
            checked={settings.levelDistributionEnabled}
            onChange={(e) => setSettings({ ...settings, levelDistributionEnabled: e.currentTarget.checked })}
          />
          <Switch
            label="Monthly Incentive Distribution"
            checked={settings.incentiveDistributionEnabled}
            onChange={(e) => setSettings({ ...settings, incentiveDistributionEnabled: e.currentTarget.checked })}
          />
        </Group>
      </Card>

      <Button onClick={handleSave} w={200}>
        Save Settings
      </Button>
    </Stack>
  );
}
