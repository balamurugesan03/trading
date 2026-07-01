import { Card, Group, Text, Title } from '@mantine/core';
import classes from './GlossyStatCard.module.css';

export default function GlossyStatCard({ label, value, color = 'blue', icon: Icon }) {
  const colorClass = classes[color] || classes.blue;

  return (
    <Card radius="lg" p="lg" className={`${classes.card} ${colorClass}`}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="sm" className={classes.label}>
            {label}
          </Text>
          <Title order={3} className={classes.value} mt={4}>
            {value}
          </Title>
        </div>
        {Icon && <Icon size={30} stroke={1.5} className={classes.icon} />}
      </Group>
    </Card>
  );
}
