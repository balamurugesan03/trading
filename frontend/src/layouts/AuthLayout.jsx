import { IconCoinFilled, IconTrendingUp, IconUsers, IconShieldCheck, IconClockHour4 } from '@tabler/icons-react';
import classes from './AuthLayout.module.css';

const FEATURES = [
  { icon: IconTrendingUp, text: 'Daily ROI with admin-managed rates, up to 2x capital return' },
  { icon: IconUsers, text: 'Instant referral bonus plus 5-level income across your network' },
  { icon: IconShieldCheck, text: 'OTP-secured withdrawals and full KYC verification' },
  { icon: IconClockHour4, text: 'Real-time wallet tracking across every income stream' },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className={classes.wrapper}>
      <div className={classes.side}>
        <div className={classes.content}>
          <div className={classes.brand}>
            <div className={classes.brandIcon}>
              <IconCoinFilled size={22} color="#fff" />
            </div>
            <div>
              <div className={classes.brandText}>Trading Fund</div>
              <div className={classes.brandSub}>Investment Platform</div>
            </div>
          </div>

          <div className={classes.headline}>{title}</div>
          <div className={classes.subcopy}>{subtitle}</div>

          <div className={classes.features}>
            {FEATURES.map((f, i) => (
              <div className={classes.feature} key={i}>
                <div className={classes.featureIcon}>
                  <f.icon size={17} color="#fff" />
                </div>
                <div className={classes.featureText}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={classes.footer}>© {new Date().getFullYear()} Trading Fund Platform</div>
      </div>

      <div className={classes.main}>
        <div className={classes.formBox}>{children}</div>
      </div>
    </div>
  );
}
