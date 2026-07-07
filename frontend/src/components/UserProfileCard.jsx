import { motion } from 'framer-motion';
import classes from './UserProfileCard.module.css';

function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function UserProfileCard({
  avatarUrl,
  userId,
  name,
  invitedBy,
  rank = 'USER',
  energyMultiplier = '2x',
  progress = 0,
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <motion.div
      className={classes.card}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, scale: 1.015 }}
    >
      <span className={classes.sheen} aria-hidden="true" />

      <motion.div
        className={classes.avatarWrap}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className={classes.avatarGlow} aria-hidden="true" />
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className={classes.avatar} />
        ) : (
          <div className={classes.avatar}>{initials(name)}</div>
        )}
      </motion.div>

      {userId && <div className={classes.idLabel}>My ID : {userId}</div>}
      <div className={classes.greeting}>Hello ! {name}</div>
      {invitedBy && <div className={classes.invitedBy}>Invited By : {invitedBy}</div>}

      <div className={classes.divider} />

      <div className={classes.statsRow}>
        <div className={classes.statCol}>
          <span className={classes.statLabel}>Rank</span>
          <span className={classes.rankValue}>{rank}</span>
        </div>
        <span className={classes.statDivider} aria-hidden="true" />
        <div className={classes.statCol}>
          <span className={classes.statLabelWhite}>Energy Bar</span>
          <span className={classes.energyValue}>{energyMultiplier}</span>
        </div>
      </div>

      <div className={classes.progressTrack}>
        <motion.div
          className={classes.progressFill}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.3 }}
        >
          <span className={classes.progressShine} aria-hidden="true" />
        </motion.div>
        <span className={classes.progressLabel}>{clampedProgress.toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}
