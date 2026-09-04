export interface SupportedLocation {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  defaultRadiusKm: number;
  areas: string[];
}

export const SUPPORTED_LOCATIONS: SupportedLocation[] = [
  {
    id: 'mumbai',
    name: 'Mumbai (MH)',
    shortName: 'Mumbai',
    lat: 19.0760,
    lng: 72.8777,
    defaultRadiusKm: 25,
    areas: ['Andheri East', 'Bandra Kurla Complex', 'Lower Parel', 'Powai', 'Navi Mumbai MIDC', 'Bhiwandi Logistics Park'],
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    shortName: 'Delhi NCR',
    lat: 28.6139,
    lng: 77.2090,
    defaultRadiusKm: 35,
    areas: ['Connaught Place', 'Okhla Industrial Area', 'Karol Bagh', 'Gurugram Cyber Hub', 'Noida Sector 62', 'Manesar'],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru (KA)',
    shortName: 'Bengaluru',
    lat: 12.9716,
    lng: 77.5946,
    defaultRadiusKm: 25,
    areas: ['Peenya Industrial Area', 'Electronic City', 'Whitefield', 'Indiranagar', 'Koramangala', 'Bommasandra'],
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad (TG)',
    shortName: 'Hyderabad',
    lat: 17.3850,
    lng: 78.4867,
    defaultRadiusKm: 25,
    areas: ['Banjara Hills', 'Jubilee Hills', 'HITEC City', 'Sanathnagar Industrial Estate', 'Cherlapally', 'Madhapur'],
  },
  {
    id: 'pune',
    name: 'Pune (MH)',
    shortName: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    defaultRadiusKm: 25,
    areas: ['Bhosari MIDC', 'Chakan Industrial Belt', 'Hinjawadi Phase 1', 'Hadapsar', 'Pimpri-Chinchwad'],
  },
  {
    id: 'chennai',
    name: 'Chennai (TN)',
    shortName: 'Chennai',
    lat: 13.0827,
    lng: 80.2707,
    defaultRadiusKm: 25,
    areas: ['Guindy Industrial Estate', 'Ambattur', 'T. Nagar', 'Sriperumbudur', 'Ennore Port Road'],
  },
];

export const DEFAULT_LOCATION = SUPPORTED_LOCATIONS[0];

export function findLocationByName(name?: string | null): SupportedLocation | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return SUPPORTED_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase() === lower ||
      loc.shortName.toLowerCase() === lower ||
      loc.id.toLowerCase() === lower ||
      loc.areas.some((area) => area.toLowerCase().includes(lower) || lower.includes(area.toLowerCase())) ||
      lower.includes(loc.shortName.toLowerCase()) ||
      lower.includes(loc.id.toLowerCase())
  );
}

export function detectUserLocation(userAddress?: string | null, userLat?: number, userLng?: number): SupportedLocation {
  if (userLat && userLng) {
    let nearest: SupportedLocation = DEFAULT_LOCATION;
    let minDistance = Infinity;
    for (const loc of SUPPORTED_LOCATIONS) {
      const d = Math.hypot(loc.lat - userLat, loc.lng - userLng);
      if (d < minDistance) {
        minDistance = d;
        nearest = loc;
      }
    }
    return nearest;
  }

  if (userAddress) {
    const matched = findLocationByName(userAddress);
    if (matched) return matched;
  }

  return DEFAULT_LOCATION;
}
