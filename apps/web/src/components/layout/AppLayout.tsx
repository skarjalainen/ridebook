import { AppShell, Group, Title, ActionIcon, useMantineColorScheme, Anchor } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Outlet, Link } from 'react-router-dom';

export function AppLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell header={{ height: 56 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Anchor component={Link} to="/" underline="never" c="inherit">
            <Title order={4}>Ridebook</Title>
          </Anchor>
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
