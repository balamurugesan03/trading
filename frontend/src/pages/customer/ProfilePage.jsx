import { useEffect, useState } from 'react';
import { Card, Title, Text, Stack, Group, ThemeIcon, Badge, Divider, CopyButton, Button, SimpleGrid } from '@mantine/core';
import {
  IconUser,
  IconId,
  IconMail,
  IconPhone,
  IconUserPlus,
  IconCalendar,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react';
import { me } from '../../services/authService';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <ThemeIcon size={32} radius="md" variant="light" color="indigo">
        <Icon size={16} />
      </ThemeIcon>
      <div>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text fw={500}>{value}</Text>
      </div>
    </Group>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    me().then((res) => setProfile(res.user));
  }, []);

  if (!profile) return null;

  return (
    <Stack>
      <Title order={2}>My Profile</Title>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder radius="md" p="lg">
          <Title order={4} mb="md">
            Account Details
          </Title>
          <Stack gap="md">
            <InfoRow icon={IconUser} label="Name" value={profile.name} />
            <InfoRow icon={IconMail} label="Email" value={profile.email} />
            <InfoRow icon={IconPhone} label="Mobile" value={profile.mobile} />
            <InfoRow
              icon={IconId}
              label="Customer ID (Referral Code)"
              value={
                <Group gap={6}>
                  <Text fw={500} ff="monospace">
                    {profile.referralCode}
                  </Text>
                  <CopyButton value={profile.referralCode}>
                    {({ copied, copy }) => (
                      <Button size="compact-xs" variant="subtle" color={copied ? 'teal' : 'indigo'} onClick={copy}>
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
              }
            />
            <InfoRow icon={IconCalendar} label="Joined" value={new Date(profile.createdAt).toLocaleString()} />
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <Title order={4} mb="md">
            Status
          </Title>
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Account Status
              </Text>
              <Badge size="lg" color={profile.status === 'active' ? 'green' : 'yellow'}>
                {profile.status}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                KYC Status
              </Text>
              <Badge
                size="lg"
                color={
                  profile.kycStatus === 'approved' ? 'green' : profile.kycStatus === 'rejected' ? 'red' : 'yellow'
                }
              >
                {profile.kycStatus}
              </Badge>
            </Group>

            <Divider my="xs" />

            <Title order={5}>Referred By</Title>
            {profile.sponsor ? (
              <Stack gap={4}>
                <InfoRow icon={IconUserPlus} label="Sponsor Name" value={profile.sponsor.name} />
                <InfoRow icon={IconMail} label="Sponsor Email" value={profile.sponsor.email} />
                <InfoRow icon={IconId} label="Sponsor Referral Code" value={profile.sponsor.referralCode} />
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No sponsor — this is a root account
              </Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
