import { useEffect, useState } from 'react';
import { Card, Title, Table, Badge, Text, Stack, SimpleGrid, Tabs, Select, Group, Center } from '@mantine/core';
import { IconUsers, IconUserPlus, IconGitBranch, IconAward, IconInbox } from '@tabler/icons-react';
import {
  getTeam,
  getReferralHistory,
  getLevelIncomeHistory,
  getIncentiveHistory,
} from '../../services/dashboardService';
import GlossyStatCard from '../../components/GlossyStatCard';

function EmptyRow({ colSpan, text }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan}>
        <Center py="lg">
          <Stack align="center" gap={4}>
            <IconInbox size={28} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" size="sm">
              {text}
            </Text>
          </Stack>
        </Center>
      </Table.Td>
    </Table.Tr>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [totalTeamMembers, setTotalTeamMembers] = useState(0);
  const [levelCounts, setLevelCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [levelFilter, setLevelFilter] = useState(null);
  const [referralRecords, setReferralRecords] = useState([]);
  const [levelIncomeRecords, setLevelIncomeRecords] = useState([]);
  const [incentiveRecords, setIncentiveRecords] = useState([]);

  useEffect(() => {
    getTeam().then((res) => {
      setMembers(res.members);
      setTotalTeamMembers(res.totalTeamMembers);
      setLevelCounts(res.levelCounts);
    });
    getReferralHistory().then((res) => setReferralRecords(res.records));
    getLevelIncomeHistory().then((res) => setLevelIncomeRecords(res.records));
    getIncentiveHistory().then((res) => setIncentiveRecords(res.records));
  }, []);

  const filteredMembers = levelFilter ? members.filter((m) => String(m.level) === levelFilter) : members;

  return (
    <Stack>
      <Title order={2}>Team &amp; Levels</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <GlossyStatCard label="Total Team Members" value={totalTeamMembers} color="indigo" icon={IconUsers} />
        <GlossyStatCard label="Direct Referrals (L1)" value={levelCounts[1] || 0} color="grape" icon={IconUserPlus} />
        <GlossyStatCard
          label="Level 2-5 Members"
          value={(levelCounts[2] || 0) + (levelCounts[3] || 0) + (levelCounts[4] || 0) + (levelCounts[5] || 0)}
          color="teal"
          icon={IconGitBranch}
        />
        <GlossyStatCard
          label="Monthly Incentives Earned"
          value={incentiveRecords.length}
          color="orange"
          icon={IconAward}
        />
      </SimpleGrid>

      <Tabs defaultValue="tree" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="tree">Referral Tree</Tabs.Tab>
          <Tabs.Tab value="level">Level Income History</Tabs.Tab>
          <Tabs.Tab value="referral">Referral History</Tabs.Tab>
          <Tabs.Tab value="incentive">Monthly Incentive History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tree" pt="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="sm">
              <Text size="sm" c="dimmed">
                Every member in your downline, up to 5 levels deep, with the level they fall under relative to you.
              </Text>
              <Select
                placeholder="All levels"
                clearable
                value={levelFilter}
                onChange={setLevelFilter}
                data={[1, 2, 3, 4, 5].map((l) => ({ value: String(l), label: `Level ${l}` }))}
                w={160}
              />
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Sponsor</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Total Invested</Table.Th>
                  <Table.Th>Joined</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredMembers.map((m) => (
                  <Table.Tr key={m._id}>
                    <Table.Td>
                      <Badge variant="light" color="indigo">
                        L{m.level}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{m.name}</Table.Td>
                    <Table.Td>{m.email}</Table.Td>
                    <Table.Td>{m.sponsorName || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={m.status === 'active' ? 'green' : 'yellow'}>{m.status}</Badge>
                    </Table.Td>
                    <Table.Td>${m.totalInvested.toFixed(2)}</Table.Td>
                    <Table.Td>{new Date(m.createdAt).toLocaleDateString()}</Table.Td>
                  </Table.Tr>
                ))}
                {filteredMembers.length === 0 && <EmptyRow colSpan={7} text="No team members yet" />}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="level" pt="md">
          <Card withBorder radius="md" p="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>From</Table.Th>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>ROI Amount</Table.Th>
                  <Table.Th>Percentage</Table.Th>
                  <Table.Th>Income</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {levelIncomeRecords.map((r) => (
                  <Table.Tr key={r._id}>
                    <Table.Td>{new Date(r.createdAt).toLocaleString()}</Table.Td>
                    <Table.Td>{r.fromUser?.name || '-'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="indigo">
                        L{r.level}
                      </Badge>
                    </Table.Td>
                    <Table.Td>${r.roiAmount.toFixed(2)}</Table.Td>
                    <Table.Td>{r.percentage}%</Table.Td>
                    <Table.Td>${r.amount.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
                {levelIncomeRecords.length === 0 && <EmptyRow colSpan={6} text="No level income yet" />}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="referral" pt="md">
          <Card withBorder radius="md" p="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>From</Table.Th>
                  <Table.Th>Investment Amount</Table.Th>
                  <Table.Th>Percentage</Table.Th>
                  <Table.Th>Bonus</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {referralRecords.map((r) => (
                  <Table.Tr key={r._id}>
                    <Table.Td>{new Date(r.createdAt).toLocaleString()}</Table.Td>
                    <Table.Td>{r.fromUser?.name || '-'}</Table.Td>
                    <Table.Td>${r.investmentAmount.toFixed(2)}</Table.Td>
                    <Table.Td>{r.percentage}%</Table.Td>
                    <Table.Td>${r.amount.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
                {referralRecords.length === 0 && <EmptyRow colSpan={5} text="No referral income yet" />}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="incentive" pt="md">
          <Card withBorder radius="md" p="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Month</Table.Th>
                  <Table.Th>Direct Business</Table.Th>
                  <Table.Th>Percentage</Table.Th>
                  <Table.Th>Reward</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {incentiveRecords.map((r) => (
                  <Table.Tr key={r._id}>
                    <Table.Td>{r.month}</Table.Td>
                    <Table.Td>${r.directBusiness.toFixed(2)}</Table.Td>
                    <Table.Td>{r.percentage}%</Table.Td>
                    <Table.Td>${r.rewardAmount.toFixed(2)}</Table.Td>
                    <Table.Td>
                      <Badge color={r.status === 'transferred' ? 'green' : 'yellow'}>{r.status}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {incentiveRecords.length === 0 && <EmptyRow colSpan={5} text="No monthly incentives yet" />}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
