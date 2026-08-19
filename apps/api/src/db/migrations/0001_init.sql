CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text NOT NULL UNIQUE,
  name           text,
  google_subject text NOT NULL UNIQUE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE allowed_users (
  email      text PRIMARY KEY,
  enabled    boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE poi_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  icon       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER poi_categories_set_updated_at BEFORE UPDATE ON poi_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RULE-015: coordinates live in PostGIS, never as loose numeric columns.
CREATE TABLE pois (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES poi_categories (id) ON DELETE RESTRICT,
  name        text NOT NULL,
  description text,
  location    geometry(Point, 4326) NOT NULL,
  visited_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pois_location_idx ON pois USING GIST (location);
CREATE INDEX pois_category_id_idx ON pois (category_id);
CREATE TRIGGER pois_set_updated_at BEFORE UPDATE ON pois
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE trips (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  planned_date date,
  driven_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trips_set_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RULE-003 / RULE-004: cascading here removes only the membership row, never the POI or trip.
CREATE TABLE trip_pois (
  trip_id  uuid NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
  poi_id   uuid NOT NULL REFERENCES pois (id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  PRIMARY KEY (trip_id, poi_id)
);
-- Deferred so a whole itinerary can be resequenced inside one transaction.
ALTER TABLE trip_pois
  ADD CONSTRAINT trip_pois_trip_id_sequence_key UNIQUE (trip_id, sequence)
  DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX trip_pois_poi_id_idx ON trip_pois (poi_id);

CREATE TABLE routes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- One route per trip for the MVP; a future "actual track" adds a kind column
  -- and drops this constraint.
  trip_id      uuid NOT NULL UNIQUE REFERENCES trips (id) ON DELETE CASCADE,
  geometry     geometry(LineString, 4326) NOT NULL,
  distance_m   double precision NOT NULL CHECK (distance_m >= 0),
  duration_s   double precision NOT NULL CHECK (duration_s >= 0),
  -- Input points kept so a route can be recalculated (UC-ROUTE-002).
  waypoints    jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile      text NOT NULL DEFAULT 'motorcycle',
  source       text NOT NULL DEFAULT 'routed' CHECK (source IN ('routed', 'manual', 'imported')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX routes_geometry_idx ON routes USING GIST (geometry);
CREATE TRIGGER routes_set_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
