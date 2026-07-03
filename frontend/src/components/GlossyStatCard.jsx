import { useRef } from 'react';
import { Card, Group, Text, Title } from '@mantine/core';
import classes from './GlossyStatCard.module.css';

export default function GlossyStatCard({ label, value, color = 'blue', icon: Icon }) {
  const colorClass = classes[color] || classes.blue;
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0)';
  };

  return (
    <Card
      ref={ref}
      radius="lg"
      p="lg"
      className={`${classes.card} ${colorClass}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={classes.sheen} aria-hidden="true" />
      <Group justify="space-between" align="flex-start" wrap="nowrap" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <Text size="sm" className={classes.label}>
            {label}
          </Text>
          <Title order={3} className={classes.value} mt={4}>
            {value}
          </Title>
        </div>
        {Icon && (
          <div className={classes.iconBox}>
            <Icon size={20} stroke={1.75} className={classes.icon} />
          </div>
        )}
      </Group>
    </Card>
  );
}
