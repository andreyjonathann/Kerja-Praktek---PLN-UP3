const fs = require('fs');

const file = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Fix imports — remove unused ones, add KinerjaDetailModal
const oldImports = `import React, { useState, useEffect, useCallback } from 'react'\r\nimport { useNavigate } from 'react-router-dom'\r\nimport {\r\n  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,\r\n  Tooltip, Legend, ResponsiveContainer, BarChart\r\n} from 'recharts'\r\nimport { Zap, Target, Activity, TrendingDown, Plus } from 'lucide-react'\r\nimport ChartWrapper from '@/components/ui/ChartWrapper'\r\nimport KpiCard from '@/components/ui/KpiCard'\r\nimport DataTable from '@/components/ui/DataTable'\r\nimport TargetWarning from '@/components/ui/TargetWarning'\r\nimport { StatusBadge } from '@/components/shared/StatusBadge'\r\nimport { useFilter } from '@/context/FilterContext'\r\nimport { MONTHS_SHORT } from '@/utils/formatters'\r\nimport { CHART_COLORS, SAIFI_CAUSES, YEARS } from '@/utils/constants'\r\nimport { getDashboardData } from '@/services/dashboardDataService'\r\nimport api from '@/services/api'\r\nimport ExportModal from '@/components/ui/ExportModal'`;

const newImports = `import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart
} from 'recharts'
import { Zap, Target, Activity, TrendingDown, Plus } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import KinerjaDetailModal from '@/components/ui/KinerjaDetailModal'
import TargetWarning from '@/components/ui/TargetWarning'
import { useFilter } from '@/context/FilterContext'
import { CHART_COLORS, SAIFI_CAUSES } from '@/utils/constants'
import { getDashboardData } from '@/services/dashboardDataService'
import ExportModal from '@/components/ui/ExportModal'`;

c = c.replace(oldImports, newImports);

// 2. Remove the entire EditableCell component
const editableCellStart = `\r\nconst EditableCell = ({ value, row, field, tableYear, onSave }) => {`;
const editableCellEnd = `};\r\n\r\nexport default function SaifiPage()`;
const startIdx = c.indexOf(editableCellStart);
const endIdx = c.indexOf('export default function SaifiPage()');
if (startIdx !== -1 && endIdx !== -1) {
  c = c.substring(0, startIdx) + '\r\n\r\n' + c.substring(endIdx);
}

// 3. Add selectedRow and isModalOpen states after tab state
c = c.replace(
  `  const [tab,    setTab]    = useState('monthly')`,
  `  const [tab,    setTab]    = useState('monthly')
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)`
);

// 4. Remove tableYear, tableData, chartYear, chartData state declarations and their useEffects
// Remove "const [tableYear, setTableYear] = useState(filters.year)" line
c = c.replace(`\r\n  const [tableYear, setTableYear] = useState(filters.year)\r\n  const [tableData, setTableData] = useState([])\r\n`, '\r\n');

// 5. Remove the 4 extra useEffects after the sigap:refresh one (tableYear, tableData, chartYear, chartData)
const toRemove = `\r\n  useEffect(() => {\r\n    setTableYear(filters.year)\r\n  }, [filters.year])\r\n\r\n  useEffect(() => {\r\n    let isMounted = true\r\n    if (tableYear === filters.year) {\r\n      setTableData(data)\r\n    } else {\r\n      getDashboardData(tableYear).then(res => {\r\n        if (isMounted) setTableData(res.saifi || [])\r\n      }).catch(err => console.error(err))\r\n    }\r\n    return () => { isMounted = false }\r\n  }, [tableYear, filters.year, data])\r\n\r\n  const [chartYear, setChartYear] = useState(filters.year)\r\n  const [chartData, setChartData] = useState([])\r\n\r\n  useEffect(() => {\r\n    setChartYear(filters.year)\r\n  }, [filters.year])\r\n\r\n  useEffect(() => {\r\n    let isMounted = true\r\n    if (chartYear === filters.year) {\r\n      setChartData(data)\r\n    } else {\r\n      getDashboardData(chartYear).then(res => {\r\n        if (isMounted) setChartData(res.saifi || [])\r\n      }).catch(err => console.error(err))\r\n    }\r\n    return () => { isMounted = false }\r\n  }, [chartYear, filters.year, data])\r\n`;
c = c.replace(toRemove, '\r\n');

// 6. Fix chartFilled reference — replace with filled
c = c.replace('  const chartFilled = chartData.filter(d => d.realisasi != null)\r\n\r\n', '');
c = c.replace(/chartFilled/g, 'filled');
c = c.replace(/chartData/g, 'data');

// 7. Remove renderEditable function
c = c.replace(`\r\n  const renderEditable = (v, row, field) => {\r\n    if (tab === 'monthly') {\r\n      return <EditableCell value={v} row={row} field={field} tableYear={tableYear} onSave={fetchData} />;\r\n    }\r\n    return v != null ? <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: '0.75rem' }}>{Number(v).toFixed(4)}</span> : '\u2014';\r\n  };\r\n`, '');

// 8. Remove year selector from chart section (actions prop)
const chartActionsBlock = `          actions={\r\n            <div style={{\r\n              display: 'inline-flex',\r\n              background: 'rgba(37, 99, 235, 0.05)',\r\n              padding: 4,\r\n              borderRadius: 12,\r\n              border: '1px solid rgba(37, 99, 235, 0.15)',\r\n              cursor: 'pointer'\r\n            }}>\r\n              <select\r\n                value={chartYear}\r\n                onChange={(e) => setChartYear(Number(e.target.value))}\r\n                style={{\r\n                  padding: '2px 24px 2px 8px',\r\n                  borderRadius: 9,\r\n                  fontSize: '0.85rem',\r\n                  fontWeight: 700,\r\n                  transition: 'all 0.2s ease',\r\n                  border: 'none',\r\n                  cursor: 'pointer',\r\n                  background: 'transparent',\r\n                  color: '#2563EB',\r\n                  outline: 'none',\r\n                  appearance: 'auto'\r\n                }}\r\n              >\r\n                {YEARS.map(y => (\r\n                <option key={y} value={y} style={{ color: 'var(--text-primary)' }}>{y}</option>\r\n              ))}\r\n              </select>\r\n            </div>\r\n          }\r\n        >`;
c = c.replace(chartActionsBlock, '        >');

// 9. Replace the entire table section (card with year selector) with simple card
const oldTableSection = `      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>\r\n        <div style={{\r\n          padding: '18px 22px 14px',\r\n          borderBottom: '1px solid var(--border)',\r\n          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12\r\n        }}>\r\n          <div style={{ flex: 1, minWidth: 0 }}>\r\n            <h3 style={{\r\n              fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)',\r\n              letterSpacing: '-0.01em', lineHeight: 1.3,\r\n              marginBottom: 0,\r\n            }}>\r\n              Detail Data SAIFI {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'}\r\n            </h3>\r\n          </div>\r\n          <div style={{\r\n            display: 'inline-flex',\r\n            background: 'rgba(16, 185, 129, 0.05)',\r\n            padding: 4,\r\n            borderRadius: 12,\r\n            border: '1px solid rgba(16, 185, 129, 0.15)',\r\n            cursor: 'pointer'\r\n          }}>\r\n            <select\r\n              value={tableYear}\r\n              onChange={(e) => setTableYear(Number(e.target.value))}\r\n              style={{\r\n                padding: '2px 24px 2px 8px',\r\n                borderRadius: 9,\r\n                fontSize: '0.85rem',\r\n                fontWeight: 700,\r\n                transition: 'all 0.2s ease',\r\n                border: 'none',\r\n                cursor: 'pointer',\r\n                background: 'transparent',\r\n                color: '#10B981',\r\n                outline: 'none',\r\n                appearance: 'auto'\r\n              }}\r\n            >\r\n              {YEARS.map(y => (\r\n                <option key={y} value={y} style={{ color: 'var(--text-primary)' }}>{y}</option>\r\n              ))}\r\n            </select>\r\n          </div>\r\n        </div>\r\n        <DataTable`;

const newTableSection = `      <div className="card p-5">
        <h3 className="section-title mb-4">Detail Data SAIFI {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'}</h3>
        <DataTable`;

c = c.replace(oldTableSection, newTableSection);

// 10. Change tableData to data in DataTable
c = c.replace(`          data={tableData}\r\n`, `          data={data}\n`);

// 11. Add onRowClick to DataTable and update columns (strip renderEditable refs)
// Find the columns block and update it
const oldColumns = `          columns={[\n            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },\n            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v != null ? Number(v).toFixed(4) : '-' },\n            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center', render: (v, row) => v != null ? <span className={\`font-bold \${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}\`}>{Number(v).toFixed(4)}</span> : <span className="text-slate-400 text-xs font-bold">-</span> }\n          ]}\n          onRowClick={(row) => {\n            setSelectedRow(row);\n            setIsModalOpen(true);\n          }}\n          data={data}`;

if (c.includes(oldColumns)) {
  console.log('Found old columns — already updated!');
} else {
  // Try to find the columns block and add onRowClick
  const colStart = c.indexOf('          columns={[');
  const colEnd = c.indexOf('          paginated={false}');
  if (colStart !== -1 && colEnd !== -1) {
    const before = c.substring(0, colStart);
    const after = c.substring(colEnd);
    const newCols = `          columns={[
            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },
            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v != null ? Number(v).toFixed(4) : '-' },
            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center', render: (v, row) => v != null ? <span className={\`font-bold \${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}\`}>{Number(v).toFixed(4)}</span> : <span className="text-slate-400 text-xs font-bold">-</span> },
          ]}
          onRowClick={(row) => {
            setSelectedRow(row)
            setIsModalOpen(true)
          }}
          data={data}
          `;
    c = before + newCols + after;
  }
}

// 12. Add KinerjaDetailModal before closing div
if (!c.includes('<KinerjaDetailModal')) {
  c = c.replace(
    `    </div>\n  )\n}`,
    `      <KinerjaDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        titlePrefix="SAIFI"
        isCumulative={tab === 'cumulative'}
        year={filters.year}
        onDeleteSuccess={fetchData}
      />
    </div>
  )
}`
  );
}

fs.writeFileSync(file, c, 'utf8');
console.log('Done!');
console.log('File size:', c.length);
