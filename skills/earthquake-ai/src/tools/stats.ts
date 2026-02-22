import { tool } from '@openclaw/tools';

export const statsAnalyze = tool({
  name: 'stats.analyze',
  description: '統計分析地震目錄數據',
  parameters: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            mag: { type: 'number' },
            time: { type: 'number' },
            coord: { type: 'array', items: { type: 'number' }, minItems: 2 }
          }
        },
        description: '地震數據陣列（來自 usgs.fetch）'
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['count', 'magnitude_stats', 'depth_distribution', 'time_series', 'spatial_clustering']
        },
        description: '要計算的指標列表，預設全部'
      }
    },
    required: ['data']
  }
}, ({ data, metrics = ['count', 'magnitude_stats', 'time_series'] }) => {
  const result: any = {};

  // 基本統計
  if (metrics.includes('count')) {
    result.total_events = data.length;
  }

  // 規模統計
  if (metrics.includes('magnitude_stats')) {
    const mags = data.map(d => d.mag).filter(m => m != null);
    if (mags.length > 0) {
      const sum = mags.reduce((a, b) => a + b, 0);
      result.magnitude = {
        min: Math.min(...mags),
        max: Math.max(...mags),
        mean: Number((sum / mags.length).toFixed(2)),
        median: mags.sort((a, b) => a - b)[Math.floor(mags.length / 2)]
      };
    }
  }

  // 時間分布
  if (metrics.includes('time_series')) {
    const byHour: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    data.forEach(eq => {
      const date = new Date(eq.time);
      const dayKey = date.toISOString().split('T')[0];
      const hourKey = `${dayKey}T${date.getHours().toString().padStart(2, '0')}`;

      byDay[dayKey] = (byDay[dayKey] || 0) + 1;
      byHour[hourKey] = (byHour[hourKey] || 0) + 1;
    });

    result.timeline = {
      daily: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      hourly: Object.entries(byHour).map(([hour, count]) => ({ hour, count }))
    };
  }

  // 空間聚集分析 (簡單網格計數)
  if (metrics.includes('spatial_clustering')) {
    const grid: Record<string, number> = {};
    const cellSize = 0.5; // 度

    data.forEach(eq => {
      const [lon, lat] = eq.coord;
      const gridX = Math.floor(lon / cellSize) * cellSize;
      const gridY = Math.floor(lat / cellSize) * cellSize;
      const key = `${gridX},${gridY}`;
      grid[key] = (grid[key] || 0) + 1;
    });

    result.clusters = Object.entries(grid)
      .map(([key, count]) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y, count };
      })
      .filter(c => c.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 clusters
  }

  return result;
});