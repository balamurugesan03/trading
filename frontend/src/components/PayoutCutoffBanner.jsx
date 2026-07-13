import { useEffect, useState } from 'react';
import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconClockHour4, IconClockPause } from '@tabler/icons-react';
import { getCutoffStatus } from '../services/withdrawalService';

const REFRESH_INTERVAL = 60000;

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// All eligibility decisions happen server-side (see backend withdrawalController.js) - this
// widget only displays a countdown. It anchors to the server's clock (fetched once, then
// re-synced every minute) rather than the browser's own clock, which a user could change.
export default function PayoutCutoffBanner() {
  const [status, setStatus] = useState(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const load = () =>
      getCutoffStatus()
        .then((res) => {
          setStatus(res);
          setOffsetMs(new Date(res.serverNow).getTime() - Date.now());
        })
        .catch(() => {});
    load();
    const refresh = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(refresh);
  }, []);

  // Cutoff time is a fixed daily "HH:mm" (Asia/Kolkata, no DST - see backend/utils/payoutCutoff.js),
  // so today's cutoff instant plus 24h reliably gives tomorrow's. Once today's cutoff passes, the
  // countdown restarts immediately toward that next cutoff instead of sitting idle until midnight;
  // the next 60s poll re-syncs it if the admin changes the cutoff time mid-cycle.
  useEffect(() => {
    if (!status) return undefined;
    const cutoffAtMs = new Date(status.cutoffAt).getTime();
    const tick = () => {
      const approxServerNow = Date.now() + offsetMs;
      const beforeCutoff = approxServerNow < cutoffAtMs;
      const nextCutoffMs = beforeCutoff ? cutoffAtMs : cutoffAtMs + DAY_MS;
      setRemainingMs(nextCutoffMs - approxServerNow);
      setIsOpen(beforeCutoff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, offsetMs]);

  if (!status || remainingMs === null) return null;

  const cutoffLabel = status.cutoffTime;

  return (
    <Card withBorder radius="md" p="md" style={{ borderColor: isOpen ? undefined : 'var(--mantine-color-orange-6)' }}>
      <Group justify="space-between" wrap="wrap">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={38} radius="xl" variant="light" color={isOpen ? 'gold' : 'orange'}>
            {isOpen ? <IconClockHour4 size={20} /> : <IconClockPause size={20} />}
          </ThemeIcon>
          <div>
            <Text size="sm" fw={600}>
              Today&apos;s payout cut-off: {cutoffLabel} (server time)
            </Text>
            {isOpen ? (
              <Text size="xs" c="dimmed">
                Time remaining to submit for today&apos;s payout cycle: {formatRemaining(remainingMs)}
              </Text>
            ) : (
              <Text size="xs" c="orange">
                Today&apos;s payout window has closed. Next payout cut-off opens in: {formatRemaining(remainingMs)}
              </Text>
            )}
          </div>
        </Group>
      </Group>
    </Card>
  );
}
