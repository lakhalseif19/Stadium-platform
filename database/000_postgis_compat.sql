-- PostGIS Compatibility Shim for environments without native PostGIS C-binaries
-- Provides geometry/geography types and ST_ functions used by the stadium platform

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry') THEN
    CREATE TYPE geometry AS (x double precision, y double precision, srid integer);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') THEN
    CREATE TYPE geography AS (x double precision, y double precision, srid integer);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION ST_MakePoint(x double precision, y double precision) 
RETURNS geometry AS $$
BEGIN
  RETURN ROW(x, y, 4326)::geometry;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_SetSRID(geom geometry, srid integer) 
RETURNS geometry AS $$
BEGIN
  RETURN ROW(geom.x, geom.y, srid)::geometry;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_X(geom geometry) RETURNS double precision AS $$
BEGIN
  RETURN geom.x;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_Y(geom geometry) RETURNS double precision AS $$
BEGIN
  RETURN geom.y;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION geography(geom geometry) RETURNS geography AS $$
BEGIN
  RETURN ROW(geom.x, geom.y, geom.srid)::geography;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION geometry(geog geography) RETURNS geometry AS $$
BEGIN
  RETURN ROW(geog.x, geog.y, geog.srid)::geometry;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_cast c
    JOIN pg_type s ON c.castsource = s.oid
    JOIN pg_type t ON c.casttarget = t.oid
    WHERE s.typname = 'geometry' AND t.typname = 'geography'
  ) THEN
    CREATE CAST (geometry AS geography) WITH FUNCTION geography(geometry) AS IMPLICIT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_cast c
    JOIN pg_type s ON c.castsource = s.oid
    JOIN pg_type t ON c.casttarget = t.oid
    WHERE s.typname = 'geography' AND t.typname = 'geometry'
  ) THEN
    CREATE CAST (geography AS geometry) WITH FUNCTION geometry(geography) AS IMPLICIT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION ST_DWithin(g1 geography, g2 geography, dist_meters double precision) 
RETURNS boolean AS $$
DECLARE
  lat1 double precision;
  lat2 double precision;
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
  d double precision;
BEGIN
  IF g1 IS NULL OR g2 IS NULL THEN
    RETURN FALSE;
  END IF;
  lat1 := radians(g1.y);
  lat2 := radians(g2.y);
  dlat := radians(g2.y - g1.y);
  dlon := radians(g2.x - g1.x);
  a := sin(dlat/2)^2 + cos(lat1) * cos(lat2) * sin(dlon/2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  d := 6371000 * c;
  RETURN d <= dist_meters;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
