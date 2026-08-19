import { Chip, Group, Paper, ScrollArea } from '@mantine/core';
import type { PoiCategory } from '@ridebook/shared';
import { categoryVisual } from './categoryVisuals';

interface PoiFilterBarProps {
  categories: PoiCategory[];
  activeCategoryIds: string[];
  onChange: (ids: string[]) => void;
}

export function PoiFilterBar({ categories, activeCategoryIds, onChange }: PoiFilterBarProps) {
  if (categories.length === 0) return null;

  return (
    <Paper shadow="sm" radius="md" p={6} withBorder>
      <ScrollArea type="hover" scrollbarSize={6} offsetScrollbars="x">
        <Chip.Group multiple value={activeCategoryIds} onChange={onChange}>
          <Group gap={6} wrap="nowrap">
            {categories.map((category) => {
              const { color, Icon } = categoryVisual(category.slug);
              return (
                <Chip key={category.id} value={category.id} size="sm" variant="outline">
                  <Group gap={6} wrap="nowrap">
                    <Icon size={14} color={color} />
                    {category.name}
                  </Group>
                </Chip>
              );
            })}
          </Group>
        </Chip.Group>
      </ScrollArea>
    </Paper>
  );
}
