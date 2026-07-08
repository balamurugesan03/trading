import { createTheme, Card, Paper, Button, Badge, Table } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'velocity',
  colors: {
    // Dual-tone brand — electric cyan (primary) + violet accent, matching the marketing site.
    velocity: ['#E0FBFF', '#B3F5FF', '#80EEFF', '#4DE6FF', '#26DFFF', '#00D9FF', '#00B8DB', '#0091B3', '#006D87', '#004A5C'],
    accent2: ['#F1E9FF', '#DDD0FE', '#C2ADFC', '#A78BFA', '#9670F8', '#8B5CF6', '#7A46E8', '#6633CC', '#5B21B6', '#43168A'],
    dark: ['#C8CDD8', '#A9B0BD', '#8B93A3', '#5F6675', '#3A3F4D', '#20222E', '#171A24', '#0D0E16', '#08090F', '#06070D'],
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
