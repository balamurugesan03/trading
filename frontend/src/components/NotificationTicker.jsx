import { useEffect, useState } from 'react';
import { ThemeIcon } from '@mantine/core';
import { IconSpeakerphone } from '@tabler/icons-react';
import { myNotifications } from '../services/notificationService';
import classes from './NotificationTicker.module.css';

const POLL_INTERVAL = 30000;

export default function NotificationTicker() {
  const [items, setItems] = useState([]);

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

  const text = items.map((n) => `${n.title}: ${n.message}`).join('     •     ');
  // Longer combined text needs more time to fully cross the screen at a steady pace.
  const duration = Math.max(15, Math.min(60, text.length * 0.12));

  return (
    <div className={classes.wrap}>
      <ThemeIcon size={30} radius="xl" variant="light" color="gold" className={classes.icon}>
        <IconSpeakerphone size={16} />
      </ThemeIcon>
      <div className={classes.track}>
        <div className={classes.item} style={{ animationDuration: `${duration}s` }}>
          {text}
        </div>
      </div>
    </div>
  );
}
