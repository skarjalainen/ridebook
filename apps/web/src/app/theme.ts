import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'orange',
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: { fontWeight: '600' },
  components: {
    // Comfortable touch targets for use with gloves on (NFR-001).
    Button: { defaultProps: { size: 'md' } },
    ActionIcon: { defaultProps: { size: 'lg' } },
  },
});
