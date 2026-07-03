import { createTheme, Card, Paper, Button, Badge, Table } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'velocity',
  colors: {
    velocity: ['#EAF2FF', '#D0E2FF', '#A3C6FF', '#75A9FF', '#4DABF7', '#2F7DFB', '#256AE0', '#1C4FC4', '#173F9D', '#123078'],
    dark: ['#C8CDD8', '#A9B0BD', '#8B93A3', '#5F6675', '#3A3F4D', '#262B36', '#171A21', '#0D0F14', '#0A0A0A', '#050505'],
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
