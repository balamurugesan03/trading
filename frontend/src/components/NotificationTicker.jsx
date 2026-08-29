import { useEffect, useState } from 'react';
import { Modal, Stack, Card, Text, Title, Group, Badge } from '@mantine/core';
import { ThemeIcon } from '@mantine/core';
import { IconSpeakerphone, IconClock } from '@tabler/icons-react';
import { myNotifications } from '../services/notificationService';
import classes from './NotificationTicker.module.css';

const POLL_INTERVAL = 30000;
const LAST_SEEN_KEY = 'ticker_last_seen_notification_id';

function getLastSeenId() {
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

function setLastSeenId(id) {
  try {
    localStorage.setItem(LAST_SEEN_KEY, id);
  } catch {
    // ignore (private mode / storage blocked) - callout just won't persist across visits
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return 'Ended';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  parts.push(`${String(hours).padStart(2, '0')}h`);
  parts.push(`${String(minutes).padStart(2, '0')}m`);
  parts.push(`${String(seconds).padStart(2, '0')}s`);
  return parts.join(' ');
}

function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = new Date(target).getTime() - now;

  return (
    <Badge color={diff <= 0 ? 'gray' : 'gold'} variant="light" leftSection={<IconClock size={12} />}>
      {diff <= 0 ? 'Ended' : formatCountdown(diff)}
    </Badge>
  );
}

export default function NotificationTicker() {
  const [items, setItems] = useState([]);
  const [opened, setOpened] = useState(false);
  const [lastSeenId, setLastSeenIdState] = useState(getLastSeenId);

  useEffect(() => {
    const load = () =>
      myNotifications('broadcast')
        .then((res) => setItems(res.notifications))
        .catch(() => {});
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  // items are sorted newest-first, so items[0] is the latest broadcast.
  const latestId = items[0]._id;
  const isNew = latestId !== lastSeenId;

  const handleOpen = () => {
    setOpened(true);
    setLastSeenId(latestId);
    setLastSeenIdState(latestId);
  };

  const text = items.map((n) => `${n.title}: ${n.message}`).join('     •     ');
  // Longer combined text needs more time to fully cross the screen at a steady pace.
  const duration = Math.max(15, Math.min(60, text.length * 0.12));

  return (
    <div className={classes.outer}>
      {isNew && (
        <div className={classes.callout} aria-hidden="true">
          <span>Click here</span>
          <svg className={classes.calloutArrow} width="26" height="20" viewBox="0 0 26 20" fill="none">
            <path
              d="M2 2C10 2 16 6 20 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M13 12L20 16L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      )}
      <div
        className={classes.wrap}
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpen()}
      >
        <ThemeIcon size={30} radius="xl" variant="light" color="gold" className={classes.icon}>
          <IconSpeakerphone size={16} />
        </ThemeIcon>
        <div className={classes.track}>
          <div className={classes.item} style={{ animationDuration: `${duration}s` }}>
            {text}
          </div>
        </div>
      </div>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Announcements" size="lg">
        <Stack>
          {items.map((n) => (
            <Card key={n._id} withBorder radius="md" p="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Title order={5}>{n.title}</Title>
                {n.eventDate && <Countdown target={n.eventDate} />}
              </Group>
              <Text mt={4} style={{ whiteSpace: 'pre-wrap' }}>
                {n.message}
              </Text>
              {n.eventDate && (
                <Text mt={6} size="xs" c="dimmed">
                  Target date: {new Date(n.eventDate).toLocaleString()}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      </Modal>
    </div>
  );
}
