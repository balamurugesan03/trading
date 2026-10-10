import { createTheme, Card, Paper, Button, Badge, Table, Title } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'velocity',
  colors: {
    // Red brand theme — crimson primary + violet accent.
    velocity: ['#FFE5E5', '#FFBDBD', '#FF9494', '#FF6B6B', '#FF4545', '#F02828', '#D11F1F', '#AD1717', '#8A1010', '#650A0A'],
    accent2: ['#F1E9FF', '#DDD0FE', '#C2ADFC', '#A78BFA', '#9670F8', '#8B5CF6', '#7A46E8', '#6633CC', '#5B21B6', '#43168A'],
    dark: ['#FFD86B', '#E8C877', '#C7A968', '#8A5A5A', '#6B2E2E', '#5A1A1A', '#4A1212', '#3D0B0B', '#300808', '#220505'],
  },
  defaultRadius: 'lg',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
  },
  shadows: {
    sm: '0 2px 10px rgba(0, 0, 0, 0.24)',
    md: '0 10px 28px rgba(0, 0, 0, 0.32)',
  },
  components: {
    Card: Card.extend({ defaultProps: { withBorder: true, shadow: 'sm', radius: 'lg', className: 'glossy-card' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'lg' } }),
    Button: Button.extend({ defaultProps: { radius: 'md' } }),
    Badge: Badge.extend({ defaultProps: { variant: 'light', radius: 'sm' } }),
    Table: Table.extend({ defaultProps: { verticalSpacing: 'sm', horizontalSpacing: 'md' } }),
  },
});

// Nested/scoped luxury black-and-gold theme, applied inside both CustomerLayout.jsx and
// AdminLayout.jsx (each wraps its tree in a `.velocity-luxury`-scoped MantineProvider), kept
// separate from the base `theme` above which still backs the shared /login and /register pages.
export const luxuryTheme = createTheme({
  primaryColor: 'gold',
  colors: {
    // Metallic gold (#D4AF37) as the mid tone, glowing highlight gold (#FFD86B) a couple
    // shades up - used for both the Mantine `gold` palette and any `color="gold"` prop.
    gold: ['#FFF9E8', '#FFF0C4', '#FFE59A', '#FFD86B', '#F0C34C', '#D4AF37', '#B3922C', '#8C7122', '#665218', '#40340F'],
    // dark[0]/[1] double as the default body text / dimmed-text colors in dark mode, so
    // these are pushed warm-gold rather than the usual neutral gray for a premium feel.
    dark: ['#FFD86B', '#E8C877', '#C7A968', '#8A5A55', '#6B2E2E', '#5A1A1A', '#4A1212', '#3D0B0B', '#300808', '#220505'],
  },
  headings: {
    fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
    fontWeight: '700',
  },
  shadows: {
    sm: '0 2px 10px rgba(0, 0, 0, 0.45)',
    md: '0 10px 28px rgba(0, 0, 0, 0.55)',
  },
  components: {
    // Headings get the brighter glow-gold rather than the slightly darker body-text gold.
    Title: Title.extend({ defaultProps: { c: '#FFD86B' } }),
  },
});
