import {
  ActionIcon,
  Badge,
  Button,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { PoiCategory, PoiFeature } from '@ridebook/shared';
import { categoryVisual } from './categoryVisuals';

interface PoiDetailSheetProps {
  poi: PoiFeature;
  category: PoiCategory | undefined;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PoiDetailSheet({
  poi,
  category,
  onClose,
  onEdit,
  onDelete,
}: PoiDetailSheetProps) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  if (isMobile) {
    return (
      // No overlay, so the map stays visible and usable behind the sheet.
      <Drawer
        opened
        onClose={onClose}
        position="bottom"
        size="45%"
        withOverlay={false}
        lockScroll={false}
        title={<Title order={5}>{poi.properties.name}</Title>}
      >
        <PoiDetailContent poi={poi} category={category} onEdit={onEdit} onDelete={onDelete} />
      </Drawer>
    );
  }

  return (
    <Paper
      pos="absolute"
      bottom={16}
      left={16}
      w={360}
      shadow="md"
      radius="md"
      p="md"
      withBorder
      style={{ zIndex: 1 }}
    >
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Title order={5}>{poi.properties.name}</Title>
        <ActionIcon variant="subtle" onClick={onClose} aria-label="Close details">
          <IconX size={18} />
        </ActionIcon>
      </Group>
      <ScrollArea.Autosize mah={320}>
        <PoiDetailContent poi={poi} category={category} onEdit={onEdit} onDelete={onDelete} />
      </ScrollArea.Autosize>
    </Paper>
  );
}

function PoiDetailContent({
  poi,
  category,
  onEdit,
  onDelete,
}: {
  poi: PoiFeature;
  category: PoiCategory | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { color, Icon } = categoryVisual(category?.slug);
  const { description, visitedAt } = poi.properties;
  const [longitude, latitude] = poi.geometry.coordinates;

  return (
    <Stack gap="sm">
      <Group gap="xs">
        <ThemeIcon variant="light" radius="xl" size="md" style={{ color }}>
          <Icon size={16} />
        </ThemeIcon>
        <Text size="sm">{category?.name ?? 'Uncategorised'}</Text>
      </Group>

      <Group gap="xs">
        {visitedAt ? (
          <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
            Visited {dayjs(visitedAt).format('D MMM YYYY')}
          </Badge>
        ) : (
          <Badge color="gray" variant="light">
            Not visited
          </Badge>
        )}
      </Group>

      {description ? (
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {description}
        </Text>
      ) : (
        <Text size="sm" c="dimmed" fs="italic">
          No description
        </Text>
      )}

      <Text size="xs" c="dimmed" ff="monospace">
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>

      <Group gap="xs">
        <Button size="xs" variant="light" leftSection={<IconPencil size={14} />} onClick={onEdit}>
          Edit
        </Button>
        <Button
          size="xs"
          variant="subtle"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={onDelete}
        >
          Delete
        </Button>
      </Group>
    </Stack>
  );
}
