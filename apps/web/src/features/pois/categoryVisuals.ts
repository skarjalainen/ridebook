import {
  IconBed,
  IconBuildingMonument,
  IconCamera,
  IconCoffee,
  IconGasStation,
  IconMapPin,
  IconMountain,
  IconRoad,
  IconTent,
  IconTool,
  IconToolsKitchen2,
  type TablerIcon,
} from '@tabler/icons-react';

export interface CategoryVisual {
  color: string;
  Icon: TablerIcon;
}

// Keyed by the slugs seeded in 0002_seed_poi_categories.sql. Colours are plain
// hex because MapLibre paints them on the canvas, outside Mantine's theme.
const VISUALS: Record<string, CategoryVisual> = {
  'scenic-viewpoint': { color: '#12b886', Icon: IconMountain },
  'great-road': { color: '#fd7e14', Icon: IconRoad },
  cafe: { color: '#be4bdb', Icon: IconCoffee },
  restaurant: { color: '#fa5252', Icon: IconToolsKitchen2 },
  fuel: { color: '#fab005', Icon: IconGasStation },
  camping: { color: '#40c057', Icon: IconTent },
  accommodation: { color: '#4c6ef5', Icon: IconBed },
  'motorcycle-service': { color: '#7950f2', Icon: IconTool },
  attraction: { color: '#e64980', Icon: IconBuildingMonument },
  'photo-spot': { color: '#15aabf', Icon: IconCamera },
  other: { color: '#868e96', Icon: IconMapPin },
};

const FALLBACK: CategoryVisual = { color: '#868e96', Icon: IconMapPin };

export function categoryVisual(slug: string | undefined): CategoryVisual {
  return (slug ? VISUALS[slug] : undefined) ?? FALLBACK;
}
