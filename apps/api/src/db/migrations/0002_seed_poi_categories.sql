INSERT INTO poi_categories (name, slug, icon, sort_order) VALUES
  ('Scenic viewpoint',   'scenic-viewpoint',   'mountain',   10),
  ('Great road',         'great-road',         'road',       20),
  ('Café',               'cafe',               'coffee',     30),
  ('Restaurant',         'restaurant',         'utensils',   40),
  ('Fuel',               'fuel',               'fuel',       50),
  ('Camping',            'camping',            'tent',       60),
  ('Accommodation',      'accommodation',      'bed',        70),
  ('Motorcycle service', 'motorcycle-service', 'wrench',     80),
  ('Attraction',         'attraction',         'landmark',   90),
  ('Photo spot',         'photo-spot',         'camera',    100),
  ('Other',              'other',              'map-pin',   110)
ON CONFLICT (slug) DO NOTHING;
