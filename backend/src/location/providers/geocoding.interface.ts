/**
 * Geocoding provider interface. Implementations resolve city names
 * to coordinates.
 */
export interface GeocodingProvider {
  resolveCity(
    city: string,
  ): Promise<{ lat: number; lng: number } | null>;
}

export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');