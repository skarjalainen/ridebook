import { AppShell, Group, Title, ActionIcon, useMantineColorScheme, Anchor } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Outlet, Link, NavLink } from 'react-router-dom';

export function AppLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell header={{ height: 56 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Anchor component={Link} to="/" underline="never" c="inherit">
              <Title order={4}>Ridebook</Title>
            </Anchor>
            <Group gap="md" wrap="nowrap">
              <Anchor component={NavLink} to="/" end underline="never" c="inherit" fz="sm">
                Map
              </Anchor>
              <Anchor component={NavLink} to="/trips" underline="never" c="inherit" fz="sm">
                Trips
              </Anchor>
            </Group>
          </Group>
          <ActionIcon
            variant="default"
            onClick={toggleColorScheme}
            aria-label="Toggle colour scheme"
          >
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
