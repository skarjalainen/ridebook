import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Center h="calc(100dvh - 56px)" p="md">
      <Stack align="center" gap="sm">
        <Title order={2}>Page not found</Title>
        <Text c="dimmed">That road does not go anywhere.</Text>
        <Button component={Link} to="/">
          Back to the map
        </Button>
      </Stack>
    </Center>
  );
}
