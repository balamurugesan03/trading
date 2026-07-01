import { useEffect, useState } from 'react';
import { Card, Title, NumberInput, Button, Stack, SimpleGrid, Text } from '@mantine/core';
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
        <NumberInput
          label="Instant Referral Bonus %"
          value={settings.referralBonusPercentage}
          onChange={(v) => setSettings({ ...settings, referralBonusPercentage: v })}
          min={0}
          max={100}
          w={250}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Level Income Percentages (of downline ROI)
        </Title>
        <SimpleGrid cols={5}>
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

      <Button onClick={handleSave} w={200}>
        Save Settings
      </Button>
    </Stack>
  );
}
