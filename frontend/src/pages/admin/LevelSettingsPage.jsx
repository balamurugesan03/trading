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

  const updateLevel = (index, value) => {
    const levelPercentages = [...settings.levelPercentages];
    levelPercentages[index] = value;
    setSettings({ ...settings, levelPercentages });
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        referralBonusPercentage: settings.referralBonusPercentage,
        levelPercentages: settings.levelPercentages,
        levelQualificationBusiness: settings.levelQualificationBusiness,
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
          Level Income Percentages (of downline ROI)
        </Title>
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }}>
          {settings.levelPercentages.map((pct, i) => (
            <NumberInput
              key={i}
              label={`Level ${i + 1}`}
              value={pct}
              onChange={(v) => updateLevel(i, v)}
              min={0}
              max={100}
            />
          ))}
        </SimpleGrid>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Qualification Rule
        </Title>
        <Text size="sm" c="dimmed" mb="xs">
          Minimum direct business a sponsor must generate before deeper levels unlock
        </Text>
        <NumberInput
          label="Qualification Business ($)"
          value={settings.levelQualificationBusiness}
          onChange={(v) => setSettings({ ...settings, levelQualificationBusiness: v })}
          min={0}
          w={250}
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
