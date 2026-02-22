import { tool } from '@openclaw/tools';
import fetch from 'node-fetch';

export const usgsFetch = tool({
  name: 'usgs.fetch',
  description: '從 USGS 取得地震數據 (GeoJSON 格式)',
  parameters: {
    type: 'object',
    properties: {
      starttime: {
        type: 'string',
        description: 'ISO 8601 格式，例如 2024-01-01T00:00:00'
      },
      endtime: {
        type: 'string',
        description: 'ISO 8601 格式，例如 2024-01-02T00:00:00'
      },
      minmagnitude: {
        type: 'number',
        description: '最小震央規模，預設 3.0'
      },
      region: {
        type: 'array',
        items: { type: 'number' },
        minItems: 4,
        maxItems: 4,
        description: '地理範圍 [xmin, xmax, ymin, ymax] (經度/緯度)'
      },
      limit: {
        type: 'number',
        description: '返回筆數上限，預設 1000'
      }
    },
    required: ['starttime', 'endtime']
  }
}, async ({ starttime, endtime, minmagnitude = 3.0, region, limit = 1000 }) => {
  let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${encodeURIComponent(starttime)}&endtime=${encodeURIComponent(endtime)}&minmagnitude=${minmagnitude}&limit=${limit}`;

  if (region) {
    const [xmin, xmax, ymin, ymax] = region;
    url += `&minlongitude=${xmin}&maxlongitude=${xmax}&minlatitude=${ymin}&maxlatitude=${ymax}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USGS API error: ${res.status} ${res.statusText}`);
  }

  const geo = await res.json();

  const earthquakes = geo.features.map(f => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    coord: f.geometry.coordinates.slice(0, 2) // [lon, lat]
  }));

  return {
    count: earthquakes.length,
    earthquakes
  };
});