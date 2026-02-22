import { tool } from '@openclaw/tools';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface PlotParams {
  type: 'map' | 'cross_section' | 'ttcurve' | 'histogram';
  data: Array<{ coord: [number, number]; mag: number; time: number }>;
  region?: [number, number, number, number];
  projection?: string;
  title?: string;
}

// 生成臨時檔案的輔助函數
function getTempPath(ext: string): string {
  const ts = Date.now();
  return path.join('/tmp', `earthquake_${ts}.${ext}`);
}

// 將地震數據轉為 PyGMT table
function dataToTable(data: Array<{ coord: [number, number]; mag: number; time: number }): string {
  const lines: string[] = [];
  for (const eq of data) {
    const [lon, lat] = eq.coord;
    lines.push(`${lon}\t${lat}\t${eq.mag}\t${eq.time}`);
  }
  return lines.join('\n');
}

export const pygmtPlot = tool({
  name: 'pygmt.plot',
  description: '使用 PyGMT 繪製地震圖表（分布圖、截面圖、走時曲線、直方圖）',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['map', 'cross_section', 'ttcurve', 'histogram'],
        description: '圖表類型'
      },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            coord: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            mag: { type: 'number' },
            time: { type: 'number' }
          },
          required: ['coord', 'mag', 'time']
        },
        description: '地震數據陣列（來自 usgs.fetch）'
      },
      region: {
        type: 'array',
        items: { type: 'number' },
        minItems: 4,
        maxItems: 4,
        description: '地圖範圍 [xmin, xmax, ymin, ymax]'
      },
      projection: {
        type: 'string',
        description: '投影方式，預設 M4i'
      },
      title: {
        type: 'string',
        description: '圖表標題'
      }
    },
    required: ['type', 'data']
  }
}, async ({ type, data, region = [119, 123, 21, 26], projection = 'M4i', title }) => {
  const pyScript = getTempPath('py');
  const outPng = getTempPath('png');
  const tableFile = getTempPath('txt');

  // 寫入臨時表格
  const tableContent = dataToTable(data);
  fs.writeFileSync(tableFile, tableContent);

  let pyCode = '';

  if (type === 'map') {
    pyCode = `
import pygmt
fig = pygmt.Figure()
fig.coast(region=${JSON.stringify(region)}, projection="${projection}", frame=True, land='gray', water='lightblue', borders=[1, 2])
with pygmt.clib.Session() as session:
    session.call_module('plot', f'{tableFile} -Scc -C0.2c -Gred -W0.5p,black')
fig.savefig('${outPng}')
`;
  } else if (type === 'histogram') {
    const mags = data.map(d => d.mag);
    pyCode = `
import pygmt
fig = pygmt.Figure()
bins = [${mags.map(m => m.toFixed(1)).join(', ')}]
fig.histogram(
    region=[3, 6, 0, 20],
    projection='X6c/3c',
    data='${tableFile}',
    series=[3, 6, 0.1],
    frame=['x+Magnitude', 'y+Count'],
    fill='lightblue',
    pen='1p,black'
)
fig.savefig('${outPng}')
`;
  } else if (type === 'cross_section') {
    pyCode = `
import pygmt
fig = pygmt.Figure()
# 簡單的深度分布 (使用 magnitude  inhibit)
fig.plot(
    region=${JSON.stringify(region)},
    projection='X6c/4c',
    x=${JSON.stringify(data.map(d => d.coord[0]))},
    y=${JSON.stringify(data.map(d => d.coord[1]))},
    style='c0.2c',
    fill='red',
    pen='1p,black'
)
fig.savefig('${outPng}')
`;
  } else if (type === 'ttcurve') {
    pyCode = `
import pygmt
fig = pygmt.Figure()
# 計算 P 波 S 波走時表 (km 到 sec)
distances = list(range(0, 1000, 50))
p_times = [d/6.0 for d in distances]  # P 波速度 ~6 km/s
s_times = [d/3.5 for d in distances]  # S 波速度 ~3.5 km/s
fig.plot(
    x=${JSON.stringify(distances)},
    y=${JSON.stringify(p_times)},
    pen='2p,blue',
    label='P-wave'
)
fig.plot(
    x=${JSON.stringify(distances)},
    y=${JSON.stringify(s_times)},
    pen='2p,red',
    label='S-wave'
)
fig.legend(position='JTR+jTR+o0.2c', box=True)
fig.savefig('${outPng}')
`;
  } else {
    throw new Error(`Unsupported plot type: ${type}`);
  }

  // 寫入 Python 腳本並執行
  fs.writeFileSync(pyScript, pyCode);

  const { stdout, stderr } = await execAsync(`python3 ${pyScript}`, { timeout: 30000 });

  if (!fs.existsSync(outPng)) {
    throw new Error(`PyGMT 繪圖失敗: ${stderr}\n${stdout}`);
  }

  // 讀取圖片並轉 base64 (Agent 工具返回)
  const buf = fs.readFileSync(outPng);
  const base64 = buf.toString('base64');
  const mime = 'image/png';

  // 清理臨時檔
  try { fs.unlinkSync(pyScript); fs.unlinkSync(tableFile); fs.unlinkSync(outPng); } catch {}

  return {
    file_path: outPng,
    file_data: `data:${mime};base64,${base64}`,
    caption: title || `${type} 圖表已完成`,
    message: `✅ PyGMT 圖表已生成 (${data.length} 個事件)`
  };
});