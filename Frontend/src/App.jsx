import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardEdit,
  Settings,
  History,
  TrendingUp,
  User,
  Calendar,
  Moon,
  Sun,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building,
  Activity,
  Layers,
  ShoppingBag,
  Briefcase,
  Users2,
  Wallet
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  initialDivisions,
  initialKpis,
  initialTargets,
  initialDailyInputs,
  initialLogs
} from './data/mockData';
import plnLogo from './assets/pln-logo.svg';
import './App.css';

export default function App() {
  // Application state
  const [divisions] = useState(initialDivisions);
  const [kpis, setKpis] = useState(initialKpis);
  const [targets, setTargets] = useState(initialTargets);
  const [dailyInputs, setDailyInputs] = useState(initialDailyInputs);
  const [logs, setLogs] = useState(initialLogs);
  
  // Navigation & UI controls
  const [activeTab, setActiveTab] = useState('overview'); // overview, input, target, customer, logs
  const [selectedDivision, setSelectedDivision] = useState(1); // 1 = Teknik, etc.
  const [currentUserRole, setCurrentUserRole] = useState('PIC'); // Admin, PIC, Viewer
  const [selectedDate, setSelectedDate] = useState('2026-06-07');
 
  // Helper: return KPIs for a division
  const getDivisionKpis = (divId) => {
    return kpis.filter(k => k.divisionId === divId);
  };

  // Get active year/month from selectedDate
  const getYearMonth = () => {
    const dt = new Date(selectedDate);
    return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
  };

  // Get target value for KPI (monthly or yearly)
  const getKpiTarget = (code, type = 'monthly') => {
    const { year, month } = getYearMonth();
    if (type === 'monthly') return targets[`${code}_${year}_${month}`] ?? 0;
    return targets[`${code}_${year}_0`] ?? 0;
  };

  // Calculate realization up to a date (supports SUM and LATEST)
  const calculateRealization = (kpiCode, dateStr) => {
    const kpi = kpis.find(k => k.code === kpiCode);
    if (!kpi) return 0;

    const entries = Object.entries(dailyInputs)
      .filter(([key]) => key.startsWith(`${kpiCode}_`));

    if (kpi.aggregationMethod === 'SUM') {
      return entries.reduce((sum, [key, data]) => {
        const d = key.replace(`${kpiCode}_`, '');
        return d <= dateStr ? sum + (parseFloat(data.value) || 0) : sum;
      }, 0);
    }

    // LATEST or other methods: return latest value <= dateStr
    const latest = entries
      .filter(([key]) => key.replace(`${kpiCode}_`, '') <= dateStr)
      .sort((a, b) => b[0].localeCompare(a[0]))[0];

    return latest ? latest[1].value : 0;
  };

  // Calculate division aggregate score
  const calculateDivisionScore = (divId, dateStr) => {
    const divKpis = getDivisionKpis(divId);
    if (!divKpis || divKpis.length === 0) return 0;
    const scores = divKpis.map(kpi => {
      const target = getKpiTarget(kpi.code, 'monthly');
      const realization = calculateRealization(kpi.code, dateStr);
      let pct = 0;
      if (target > 0) {
        if (kpi.code.includes('SAIDI') || kpi.code.includes('SAIFI') || kpi.code.includes('K3_INCIDENT')) {
          pct = realization === 0 ? 100 : Math.max(0, Math.min(100, (target / realization) * 100));
        } else {
          pct = Math.max(0, Math.min(120, (realization / target) * 100));
        }
      } else {
        pct = realization > 0 ? 100 : 0;
      }
      return pct;
    });
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    return Math.round(avg);
  };

  const getStatusLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Attention';
  };

  const getStatusColorClass = (score) => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  const validateDateForInput = (dateStr) => {
    const selected = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today - selected) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const triggerAlert = (message, type = 'info') => {
    // minimal alert: console + optional window alert during dev
    console.log(`[${type.toUpperCase()}] ${message}`);
  };


  // Handle Input Form Submission
  const handleSaveDailyInputs = (e) => {
    e.preventDefault();
    if (currentUserRole !== 'PIC' && currentUserRole !== 'Admin') {
      triggerAlert('Akses Ditolak: Hanya PIC atau Admin yang dapat mengisi data harian.', 'warning');
      return;
    }

    if (!validateDateForInput(selectedDate)) {
      triggerAlert('Gagal: Tanggal pengisian melebihi batas pengisian mundur (Maksimal H-7).', 'warning');
      return;
    }

    const formData = new FormData(e.target);
    const updatedInputs = { ...dailyInputs };
    const newLogs = [...logs];
    let changesMade = 0;

    getDivisionKpis(selectedDivision).forEach(kpi => {
      const valInput = formData.get(kpi.code);
      if (valInput !== null && valInput !== '') {
        const val = parseFloat(valInput);
        const key = `${kpi.code}_${selectedDate}`;
        const oldVal = dailyInputs[key]?.value;

        if (oldVal !== val) {
          updatedInputs[key] = {
            value: val,
            pic: currentUserRole.toLowerCase(),
            updatedAt: new Date().toISOString().replace('T', ' ').split('.')[0]
          };

          // Audit Log
          const logId = newLogs.length + 1;
          const logTime = new Date().toISOString().replace('T', ' ').split('.')[0];
          newLogs.unshift({
            id: logId,
            user: currentUserRole.toLowerCase(),
            action: oldVal === undefined ? 'CREATE' : 'UPDATE',
            tableName: 'daily_kpi_inputs',
            record: `${kpi.code} (${selectedDate})`,
            time: logTime,
            details: oldVal === undefined 
              ? `Realisasi diinput: ${val} ${kpi.unit}`
              : `Realisasi diubah dari ${oldVal} ke ${val} ${kpi.unit}`
          });
          changesMade++;
        }
      }
    });

    if (changesMade > 0) {
      setDailyInputs(updatedInputs);
      setLogs(newLogs);
      triggerAlert(`Berhasil menyimpan ${changesMade} data realisasi harian.`, 'success');
    } else {
      triggerAlert('Tidak ada perubahan data yang disimpan.', 'info');
    }
  };

  // Handle Target Configuration Submission
  const handleSaveTargets = (e) => {
    e.preventDefault();
    if (currentUserRole !== 'Admin') {
      triggerAlert('Akses Ditolak: Hanya Admin yang dapat mengonfigurasi target KPI.', 'warning');
      return;
    }

    const { year, month } = getYearMonth();
    const formData = new FormData(e.target);
    const updatedTargets = { ...targets };
    const newLogs = [...logs];
    let changesMade = 0;

    getDivisionKpis(selectedDivision).forEach(kpi => {
      // Monthly Target
      const monthlyValInput = formData.get(`${kpi.code}_monthly`);
      if (monthlyValInput !== null && monthlyValInput !== '') {
        const mVal = parseFloat(monthlyValInput);
        const mKey = `${kpi.code}_${year}_${month}`;
        const oldMVal = targets[mKey];

        if (oldMVal !== mVal) {
          updatedTargets[mKey] = mVal;
          const logTime = new Date().toISOString().replace('T', ' ').split('.')[0];
          newLogs.unshift({
            id: newLogs.length + 1,
            user: 'admin',
            action: oldMVal === undefined ? 'CREATE' : 'UPDATE',
            tableName: 'kpi_targets',
            record: `${kpi.code} (Bulanan - ${year}/${month})`,
            time: logTime,
            details: oldMVal === undefined
              ? `Target bulanan diatur: ${mVal} ${kpi.unit}`
              : `Target bulanan diubah dari ${oldMVal} ke ${mVal} ${kpi.unit}`
          });
          changesMade++;
        }
      }

      // Yearly Target
      const yearlyValInput = formData.get(`${kpi.code}_yearly`);
      if (yearlyValInput !== null && yearlyValInput !== '') {
        const yVal = parseFloat(yearlyValInput);
        const yKey = `${kpi.code}_${year}_0`;
        const oldYVal = targets[yKey];

        if (oldYVal !== yVal) {
          updatedTargets[yKey] = yVal;
          const logTime = new Date().toISOString().replace('T', ' ').split('.')[0];
          newLogs.unshift({
            id: newLogs.length + 1,
            user: 'admin',
            action: oldYVal === undefined ? 'CREATE' : 'UPDATE',
            tableName: 'kpi_targets',
            record: `${kpi.code} (Tahunan - ${year})`,
            time: logTime,
            details: oldYVal === undefined
              ? `Target tahunan diatur: ${yVal} ${kpi.unit}`
              : `Target tahunan diubah dari ${oldYVal} ke ${yVal} ${kpi.unit}`
          });
          changesMade++;
        }
      }
    });

    if (changesMade > 0) {
      setTargets(updatedTargets);
      setLogs(newLogs);
      triggerAlert(`Berhasil memperbarui ${changesMade} target KPI.`, 'success');
    } else {
      triggerAlert('Tidak ada perubahan target yang disimpan.', 'info');
    }
  };

  // Mock Export function
  const handleExport = (format) => {
    const { year, month } = getYearMonth();
    triggerAlert(`Mengekspor Laporan Bulanan (${year}-${month}) dalam format ${format.toUpperCase()}...`, 'success');
  };

  // Generate chart data for Recharts (Weekly trends from June 1st to June 7th, 2026)
  const getTrendChartData = () => {
    const trendData = [];
    const divKpis = getDivisionKpis(selectedDivision);
    const startDate = new Date('2026-06-01');

    for (let day = 0; day < 7; day++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + day);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `Tgl ${d.getDate()}`;

      const dataRow = { name: dayLabel };
      divKpis.forEach(kpi => {
        // Find daily value up to this date
        dataRow[kpi.name.split(' (')[0]] = calculateRealization(kpi.code, dateStr);
      });
      trendData.push(dataRow);
    }
    return trendData;
  };

  // Overall aggregate score for PLN UP3
  const calculatePLNScore = () => {
    let totalScore = 0;
    divisions.forEach(d => {
      totalScore += calculateDivisionScore(d.id, selectedDate);
    });
    return Math.round(totalScore / divisions.length);
  };

  const getLatestInputForKpi = (kpiCode) => {
    const latestEntry = Object.entries(dailyInputs)
      .filter(([key]) => key.startsWith(`${kpiCode}_`))
      .sort((a, b) => b[0].localeCompare(a[0]))[0];

    if (!latestEntry) return null;

    const [key, data] = latestEntry;
    return {
      date: key.replace(`${kpiCode}_`, ''),
      value: data.value,
      pic: data.pic,
      updatedAt: data.updatedAt
    };
  };

  const getDivisionPlanningItems = (divId) => {
    return getDivisionKpis(divId).map(kpi => {
      const target = getKpiTarget(kpi.code, 'monthly');
      const realization = calculateRealization(kpi.code, selectedDate);
      const latest = getLatestInputForKpi(kpi.code);

      let score = 0;
      if (target > 0) {
        if (kpi.code.includes('SAIDI') || kpi.code.includes('SAIFI') || kpi.code.includes('K3_INCIDENT')) {
          score = realization === 0 ? 100 : Math.max(0, Math.min(100, (target / realization) * 100));
        } else {
          score = Math.max(0, Math.min(120, (realization / target) * 100));
        }
      } else {
        score = realization > 0 ? 100 : 0;
      }

      return {
        ...kpi,
        target,
        realization,
        score: Math.round(score),
        latest
      };
    });
  };

  const planningDivisionCards = divisions.map(div => {
    const items = getDivisionPlanningItems(div.id);
    const score = calculateDivisionScore(div.id, selectedDate);
    return {
      ...div,
      score,
      status: getStatusLabel(score),
      statusClass: getStatusColorClass(score),
      items,
      topItems: items.slice(0, 2)
    };
  });

  const customerDivisionId = 2;
  const customerDivision = divisions.find(div => div.id === customerDivisionId);
  const customerItems = getDivisionPlanningItems(customerDivisionId);
  const customerTrendKpis = getDivisionKpis(customerDivisionId);
  const customerTopItems = customerItems.slice(0, 4);
  const customerScore = calculateDivisionScore(customerDivisionId, selectedDate);
  const customerTrendData = (() => {
    const trend = [];
    const startDate = new Date('2026-06-01');

    for (let day = 0; day < 7; day++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + day);
      const dateStr = d.toISOString().split('T')[0];
      trend.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: calculateDivisionScore(customerDivisionId, dateStr)
      });
    }

    return trend;
  })();

  const customerMetricCards = [
    {
      title: 'Customer Complaints',
      value: Math.max(20, 100 - customerScore),
      subtitle: '+12% vs last week',
      accent: 'red',
      icon: 'warning'
    },
    {
      title: 'Resolved',
      value: Math.max(10, Math.round(customerItems.reduce((sum, item) => sum + item.score, 0) / customerItems.length)),
      subtitle: '+8% resolution rate',
      accent: 'blue',
      icon: 'check'
    },
    {
      title: 'New Requests',
      value: customerTopItems.length * 10,
      subtitle: 'Avg. 2h pending time',
      accent: 'yellow',
      icon: 'queue'
    },
    {
      title: 'Pending',
      value: Math.max(5, 30 - customerTopItems.length * 3),
      subtitle: '3 critical tickets',
      accent: 'brown',
      icon: 'pending'
    },
    {
      title: 'SLA Achievement',
      value: customerScore,
      subtitle: 'On target (80%)',
      accent: 'blue',
      icon: 'gear'
    }
  ];

  const customerCategories = [
    { name: 'Teknis', value: 42, percent: 49, color: '#2f66b3' },
    { name: 'Tagihan', value: 28, percent: 33, color: '#8b5a1f' },
    { name: 'Sambungan Baru', value: 15, percent: 18, color: '#7a3b12' }
  ];

  const customerTickets = [
    { ticket: 'PLG-042', customer: 'Keluhan meter', staff: 'Teknik', status: 'Resolved', date: '10 menit lalu' },
    { ticket: 'PLG-067', customer: 'Tagihan menumpuk', staff: 'Niaga', status: 'On Progress', date: '45 menit lalu' },
    { ticket: 'PLG-081', customer: 'Sambungan baru', staff: 'Admin', status: 'Pending', date: '2 jam lalu' },
    { ticket: 'PLG-094', customer: 'Komplain tegangan', staff: 'Teknik', status: 'Critical', date: '5 jam lalu' }
  ];

  const plnScore = calculatePLNScore();

  // --- Teknik work orders data used on Teknik page ---
  const initialWorkOrders = [
    { id: 'WO-2023-0891', loc: 'Trafo KJ-12 Substation', staff: 'Agus Santoso', dl: '24 Oct 2023, 14:00', status: 'In Progress' },
    { id: 'WO-2023-0895', loc: 'Jaringan SUTM Jalur 3', staff: 'Bambang Pamungkas', dl: '24 Oct 2023, 16:30', status: 'New' },
    { id: 'WO-2023-0888', loc: 'Gardu Distribusi GD-05', staff: 'Rudi Hermawan', dl: '23 Oct 2023, 09:00', status: 'Delayed' },
    { id: 'WO-2023-0880', loc: 'Pemasangan SR Baru', staff: 'M. Arifin', dl: '24 Oct 2023, 11:00', status: 'Completed' },
    { id: 'WO-2023-0900', loc: 'Distribusi Seksi A', staff: 'Siti', dl: '25 Oct 2023, 09:00', status: 'In Progress' },
    { id: 'WO-2023-0901', loc: 'Gardu Baru', staff: 'Rudi', dl: '25 Oct 2023, 11:00', status: 'Delayed' }
  ];

  const [workOrders] = useState(initialWorkOrders);
  const [woFilterStatus, setWoFilterStatus] = useState('All');
  const [woSearch, setWoSearch] = useState('');
  const [woPage, setWoPage] = useState(1);
  const woPageSize = 4;

  const statusCounts = workOrders.reduce((acc, w) => {
    const s = w.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([key, val]) => ({ name: key, value: val }));

  const filteredWorkOrders = workOrders.filter(w => {
    const byStatus = woFilterStatus === 'All' ? true : w.status === woFilterStatus;
    const q = woSearch.trim().toLowerCase();
    const bySearch = q === '' ? true : (w.id + ' ' + w.loc + ' ' + w.staff).toLowerCase().includes(q);
    return byStatus && bySearch;
  });

  const woTotalPages = Math.max(1, Math.ceil(filteredWorkOrders.length / woPageSize));
  const woPageItems = filteredWorkOrders.slice((woPage - 1) * woPageSize, woPage * woPageSize);

  const handleExportCsv = (rows) => {
    const cols = ['WO ID','LOCATION','ASSIGNED STAFF','DEADLINE','STATUS'];
    const csv = [cols.join(',')].concat(rows.map(r => [r.id, '"'+r.loc+'"', r.staff, '"'+r.dl+'"', r.status].join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workorders_export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onPieClick = (data) => {
    if (!data || !data.name) return;
    setWoFilterStatus(data.name);
    setWoPage(1);
  };

  return (
    <div className="app-container">
      {/* Sidebar Layout */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-pln-box">
            <img src={plnLogo} alt="Logo PLN" className="logo-pln-image" />
          </div>
          <div className="logo-text-container">
            <span className="logo-text">PLN UP3</span>
            <span className="logo-sub">Monitoring KPI</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('overview')}>
              <LayoutDashboard size={18} />
              <span>Dashboard Overview</span>
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'input' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('input')}>
              <ClipboardEdit size={18} />
              <span>Input Data Harian</span>
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'target' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('target')}>
              <Settings size={18} />
              <span>Perencanaan</span>
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'tech' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('tech')}>
              <Activity size={18} />
              <span>Teknik</span>
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'customer' ? 'active' : ''}`}>
            <button onClick={() => {
              setSelectedDivision(customerDivisionId);
              setActiveTab('customer');
            }}>
              <Users2 size={18} />
              <span>Pelayanan Pelanggan</span>
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('logs')}>
              <History size={18} />
              <span>Audit Log Perubahan</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Container */}
      <main className="app-content">
        <div className="page-container animate-fade">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
          <>
              {/* Overview Top KPI Row */}
              <div className="overview-top-grid">
                <div className="kpi-summary-grid">
                  <div className="kpi-card">
                    <div className="kpi-label">TOTAL PEKERJAAN</div>
                    <div className="kpi-value">1,250</div>
                    <div className="kpi-sub">+5.2% vs bulan lalu</div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-label">PEKERJAAN SELESAI</div>
                    <div className="kpi-value">980</div>
                    <div className="kpi-sub">+8.1% efisiensi naik</div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-label">PEKERJAAN BERJALAN</div>
                    <div className="kpi-value">210</div>
                    <div className="kpi-sub">On Progress</div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-label">PEKERJAAN TERLAMBAT</div>
                    <div className="kpi-value late">60</div>
                    <div className="kpi-sub critical">Critical · perlu atensi</div>
                  </div>

                  <div className="kpi-card kpi-percent">
                    <div className="kpi-label">PENYELESAIAN</div>
                    <div className="kpi-value">78%</div>
                    <div className="kpi-sub">Rata-rata penyelesaian</div>
                  </div>
                </div>
              </div>

              {/* Main overview grid: chart + right column */}
              <div className="overview-main-grid">
                <div className="chart-card large-chart">
                  <div className="chart-header">
                    <div className="chart-title">
                      <h3>Daily Work Completion Trend</h3>
                      <p>Menampilkan grafik perbandingan tren indikator divisi {divisions.find(d => d.id === selectedDivision)?.name}</p>
                    </div>
                    <div className="chart-controls">
                      <select 
                        className="chart-select" 
                        value={selectedDivision} 
                        onChange={(e) => setSelectedDivision(parseInt(e.target.value))}
                      >
                        {divisions.map(d => (
                          <option key={d.id} value={d.id}>Divisi {d.name}</option>
                        ))}
                      </select>
                      <button className="btn-secondary" onClick={() => handleExport('excel')}>
                        <Download size={14} />
                        <span>Ekspor Excel</span>
                      </button>
                      <button className="btn-secondary" onClick={() => handleExport('pdf')}>
                        <Download size={14} />
                        <span>Ekspor PDF</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <LineChart data={getTrendChartData()} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                        <Legend />
                        {getDivisionKpis(selectedDivision).map((kpi, index) => {
                          const colors = ['#007cc2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                          const strokeColor = colors[index % colors.length];
                          return (
                            <Line 
                              key={kpi.code}
                              type="monotone" 
                              dataKey={kpi.name.split(' (')[0]} 
                              stroke={strokeColor} 
                              strokeWidth={3} 
                              activeDot={{ r: 8 }} 
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="right-column">
                  <div className="chart-card donut-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>Task Status Distribution</h4>
                          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Total {workOrders.length}</p>
                        </div>
                        <div style={{ width: 140, height: 140 }}>
                          <ResponsiveContainer width={140} height={140}>
                            <PieChart>
                              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={56} onClick={(e) => onPieClick(e)}>
                                {pieData.map((entry, idx) => {
                                  const colors = ['#2f66b3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                  return <Cell key={`c-${idx}`} fill={colors[idx % colors.length]} />;
                                })}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div className="legend-rows">
                          {pieData.map((p, i) => (
                            <div key={p.name} className="legend-row"><span className="legend-dot" style={{ backgroundColor: ['#2f66b3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }} /> <span className="legend-name">{p.name}</span> <span className="legend-value">{p.value}</span></div>
                          ))}
                        </div>
                      </div>
                    </div>

                  <div className="chart-card notifications-card">
                    <div className="chart-header" style={{ marginBottom: '8px' }}>
                      <div className="chart-title">
                        <h3>Recent Activities</h3>
                        <p>Notifikasi yang perlu tindakan</p>
                      </div>
                    </div>

                    <div className="notifications-list">
                      {/* Build a few highlighted notifications */}
                      {[{
                        id: 1,
                        title: 'Pekerjaan terlambat',
                        subtitle: '60 pekerjaan terlambat di seluruh UP3',
                        type: 'critical',
                        time: '2 hari lalu'
                      }, {
                        id: 2,
                        title: 'System Alert: Pekerjaan tertunda',
                        subtitle: 'Pekerjaan penarikan kabel di Joglo terdeteksi terlambat 2 hari',
                        type: 'warning',
                        time: '2 jam lalu'
                      }, {
                        id: 3,
                        title: 'Perencanaan menambahkan draft',
                        subtitle: 'Draft pembangunan SUTM baru ditambahkan',
                        type: 'info',
                        time: '45 menit lalu'
                      }].map(n => (
                        <div key={n.id} className={`notification-item ${n.type}`}>
                          <div className="notification-left">
                            {n.type === 'critical' ? <AlertTriangle size={18} /> : n.type === 'warning' ? <AlertCircle size={18} /> : <Activity size={18} />}
                          </div>
                          <div className="notification-body">
                            <div className="notification-title">{n.title}</div>
                            <div className="notification-sub">{n.subtitle}</div>
                            <div className="notification-meta">{n.time}</div>
                          </div>
                          <div className="notification-actions">
                            {n.type === 'critical' && <button className="btn-action" onClick={() => triggerAlert('Memulai tindak lanjut untuk pekerjaan terlambat...', 'warning')}>Tindak Lanjut</button>}
                            <button className="btn-link" onClick={() => triggerAlert('Membuka detail aktivitas...', 'info')}>Lihat</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="table-footer">
                    <div className="pagination-controls">
                      <button className="btn-secondary" onClick={() => setWoPage(p => Math.max(1, p-1))} disabled={woPage<=1}>Prev</button>
                      <span style={{ padding: '0 8px' }}>{woPage} / {woTotalPages}</span>
                      <button className="btn-secondary" onClick={() => setWoPage(p => Math.min(woTotalPages, p+1))} disabled={woPage>=woTotalPages}>Next</button>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Showing {filteredWorkOrders.length} results</div>
                  </div>
                </div>
              </div>

              {/* Data Table breakdown for detail analysis */}
              <div className="chart-card">
                <div className="chart-header" style={{ marginBottom: '16px' }}>
                  <div className="chart-title">
                    <h3>Breakdown Realisasi vs Target Divisi {divisions.find(d => d.id === selectedDivision)?.name}</h3>
                    <p>Realisasi kumulatif per tanggal {selectedDate} dibandingkan target bulan berjalan</p>
                  </div>
                </div>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode KPI</th>
                        <th>Indikator KPI</th>
                        <th>Unit</th>
                        <th>Metode Agregasi</th>
                        <th>Target Bulanan</th>
                        <th>Realisasi Kumulatif</th>
                        <th>Pencapaian (%)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDivisionKpis(selectedDivision).map(kpi => {
                        const target = getKpiTarget(kpi.code, 'monthly');
                        const realization = calculateRealization(kpi.code, selectedDate);
                        
                        let percentage = 0;
                        if (target > 0) {
                          if (kpi.code.includes('SAIDI') || kpi.code.includes('SAIFI') || kpi.code.includes('K3_INCIDENT')) {
                            percentage = realization === 0 ? 100 : Math.max(0, Math.min(100, (target / realization) * 100));
                          } else {
                            percentage = Math.max(0, Math.min(120, (realization / target) * 100));
                          }
                        } else {
                          percentage = realization > 0 ? 100 : 0;
                        }
                        
                        const score = Math.round(percentage);
                        const statusColor = getStatusColorClass(score);

                        return (
                          <tr key={kpi.code}>
                            <td style={{ fontWeight: 'bold' }}>{kpi.code}</td>
                            <td>{kpi.name}</td>
                            <td>{kpi.unit}</td>
                            <td>{kpi.aggregationMethod}</td>
                            <td style={{ fontWeight: '600' }}>{target}</td>
                            <td style={{ fontWeight: '600', color: 'var(--pln-blue)' }}>{realization}</td>
                            <td style={{ fontWeight: '700' }}>{score}%</td>
                            <td>
                              <span className={`badge-status ${statusColor}`}>{getStatusLabel(score)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
          </>
          )}

          {/* TAB 2: DAILY INPUT FORM (PIC/Admin) */}
          {activeTab === 'input' && (
            <div className="chart-card">
              <div className="chart-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div className="chart-title">
                  <h3>Pengisian Nilai Realisasi KPI Harian</h3>
                  <p>PIC menginput nilai harian untuk setiap divisi operasional.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="badge-status yellow" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    Batas Input Backdated: 7 Hari
                  </div>
                </div>
              </div>

              {/* Alert Warning for User Role */}
              {currentUserRole === 'Viewer' && (
                <div className="alert-banner warning" style={{ marginBottom: '24px' }}>
                  <AlertTriangle size={18} />
                  <span>Akses Terbatas: Anda login sebagai <b>Viewer (Read-only)</b>. Silakan ubah Role di pojok kanan atas ke <b>PIC</b> atau <b>Admin</b> untuk melakukan pengisian data.</span>
                </div>
              )}

              {/* Date validation banner */}
              {!validateDateForInput(selectedDate) ? (
                <div className="alert-banner warning" style={{ marginBottom: '24px' }}>
                  <AlertCircle size={18} />
                  <span>Peringatan Tanggal: Tanggal terpilih (<b>{selectedDate}</b>) sudah di luar batas penginputan/pengeditan mundur (H-7 dari hari ini 2026-06-08). Form terkunci.</span>
                </div>
              ) : (
                <div className="alert-banner info" style={{ marginBottom: '24px' }}>
                  <CheckCircle2 size={18} />
                  <span>Tanggal Input Terpilih: <b>{selectedDate}</b> (Berada dalam batas pengisian 7 hari terakhir. Form aktif).</span>
                </div>
              )}

              {/* Division tabs in input screen */}
              <div className="tabs-header">
                {divisions.map(div => (
                  <button 
                    key={div.id}
                    className={`tab-btn ${selectedDivision === div.id ? 'active' : ''}`}
                    onClick={() => setSelectedDivision(div.id)}
                  >
                    Divisi {div.name}
                  </button>
                ))}
              </div>

              {/* Form Input Table */}
              <form onSubmit={handleSaveDailyInputs}>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode KPI</th>
                        <th>Indikator KPI</th>
                        <th>Satuan</th>
                        <th>Target Bulan Ini</th>
                        <th>Realisasi Harian ({selectedDate})</th>
                        <th>Realisasi Sebelumnya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDivisionKpis(selectedDivision).map(kpi => {
                        const inputKey = `${kpi.code}_${selectedDate}`;
                        const target = getKpiTarget(kpi.code, 'monthly');
                        const existingValue = dailyInputs[inputKey]?.value;

                        return (
                          <tr key={kpi.code}>
                            <td style={{ fontWeight: 'bold' }}>{kpi.code}</td>
                            <td>{kpi.name}</td>
                            <td>{kpi.unit}</td>
                            <td style={{ fontWeight: '600' }}>{target}</td>
                            <td>
                              <input 
                                type="number" 
                                step="any"
                                name={kpi.code}
                                className="table-input"
                                placeholder="Masukkan nilai..."
                                defaultValue={existingValue !== undefined ? existingValue : ''}
                                disabled={currentUserRole === 'Viewer' || !validateDateForInput(selectedDate)}
                                required
                              />
                            </td>
                            <td>
                              {existingValue !== undefined ? (
                                <span style={{ color: 'var(--pln-blue)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                  Sudah diisi: {existingValue} {kpi.unit} (oleh {dailyInputs[inputKey].pic})
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  Belum diisi
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => triggerAlert('Mengatur ulang form...', 'info')}
                    disabled={currentUserRole === 'Viewer' || !validateDateForInput(selectedDate)}
                  >
                    Reset Form
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={currentUserRole === 'Viewer' || !validateDateForInput(selectedDate)}
                  >
                    Simpan Data Realisasi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PERENCANAAN */}
          {activeTab === 'target' && (
            <div className="planning-page">
              <div className="planning-hero chart-card">
                <div className="planning-hero-text">
                  <div className="planning-kicker">OPERATIONAL PLANNING</div>
                  <h2>Perencanaan Bidang</h2>
                  <p>Semua bidang terlihat sekaligus, lalu detail aktivitas per bidang diturunkan di panel bawah agar mudah dibandingkan.</p>
                </div>
                <div className="planning-hero-score">
                  <div className="planning-hero-value">{plnScore}%</div>
                  <span className={`badge-status ${getStatusColorClass(plnScore)}`}>{getStatusLabel(plnScore)}</span>
                  <small>Rata-rata seluruh bidang</small>
                </div>
              </div>

              <div className="planning-grid">
                {planningDivisionCards.map(div => (
                  <div
                    key={div.id}
                    className={`planning-division-card ${selectedDivision === div.id ? 'active' : ''}`}
                    onClick={() => setSelectedDivision(div.id)}
                  >
                    <div className="planning-card-head">
                      <div>
                        <h3>Divisi {div.name}</h3>
                        <p>{div.description}</p>
                      </div>
                      <span className={`badge-status ${div.statusClass}`}>{div.status}</span>
                    </div>

                    <div className="planning-score-row">
                      <strong>{div.score}%</strong>
                      <span>{div.items.length} indikator</span>
                    </div>

                    <div className="planning-mini-list">
                      {div.topItems.map(item => (
                        <div key={item.code} className="planning-mini-item">
                          <span className="planning-mini-code">{item.code}</span>
                          <span className="planning-mini-name">{item.name}</span>
                          <span className="planning-mini-value">
                            {item.latest ? `${item.latest.value} ${item.unit}` : `Target ${item.target} ${item.unit}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="planning-detail-grid">
                <div className="chart-card planning-panel">
                  <div className="chart-header">
                    <div className="chart-title">
                      <h3>Aktivitas Bidang {divisions.find(d => d.id === selectedDivision)?.name}</h3>
                      <p>Detail indikator, target, dan realisasi terbaru untuk bidang yang dipilih.</p>
                    </div>
                  </div>

                  <div className="planning-activity-list">
                    {getDivisionPlanningItems(selectedDivision).map(item => (
                      <div key={item.code} className="planning-activity-row">
                        <div>
                          <strong>{item.name}</strong>
                          <div className="planning-activity-meta">
                            {item.code} · Target {item.target} {item.unit}
                          </div>
                        </div>
                        <div className="planning-activity-values">
                          <span className="planning-activity-realization">
                            {item.latest ? `${item.latest.value} ${item.unit}` : `${item.realization} ${item.unit}`}
                          </span>
                          <span className={`badge-status ${getStatusColorClass(item.score)}`}>
                            {item.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chart-card planning-panel">
                  <div className="chart-header">
                    <div className="chart-title">
                      <h3>Ringkasan Per Bidang</h3>
                      <p>Semua bidang tampil dalam satu panel untuk lihat aktivitas dan statusnya cepat.</p>
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Bidang</th>
                          <th>Indikator</th>
                          <th>Skor</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planningDivisionCards.map(div => (
                          <tr key={div.id}>
                            <td style={{ fontWeight: '700' }}>{div.name}</td>
                            <td>{div.items.length} aktivitas</td>
                            <td style={{ fontWeight: '700', color: 'var(--pln-blue)' }}>{div.score}%</td>
                            <td><span className={`badge-status ${div.statusClass}`}>{div.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">
                    <h3>Grafik Tren Realisasi Harian (Kumulatif Bulan Berjalan)</h3>
                    <p>Menampilkan grafik perbandingan tren indikator divisi {divisions.find(d => d.id === selectedDivision)?.name}</p>
                  </div>
                  <div className="chart-controls">
                    <select 
                      className="chart-select" 
                      value={selectedDivision} 
                      onChange={(e) => setSelectedDivision(parseInt(e.target.value))}
                    >
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>Divisi {d.name}</option>
                      ))}
                    </select>
                    <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleExport('excel')}>
                      <Download size={14} />
                      <span>Ekspor Excel</span>
                    </button>
                    <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleExport('pdf')}>
                      <Download size={14} />
                      <span>Ekspor PDF</span>
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <LineChart data={getTrendChartData()} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                      <Legend />
                      {getDivisionKpis(selectedDivision).map((kpi, index) => {
                        const colors = ['#007cc2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                        const strokeColor = colors[index % colors.length];
                        return (
                          <Line 
                            key={kpi.code}
                            type="monotone" 
                            dataKey={kpi.name.split(' (')[0]} 
                            stroke={strokeColor} 
                            strokeWidth={3} 
                            activeDot={{ r: 8 }} 
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header" style={{ marginBottom: '16px' }}>
                  <div className="chart-title">
                    <h3>Breakdown Realisasi vs Target Divisi {divisions.find(d => d.id === selectedDivision)?.name}</h3>
                    <p>Realisasi kumulatif per tanggal {selectedDate} dibandingkan target bulan berjalan</p>
                  </div>
                </div>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode KPI</th>
                        <th>Indikator KPI</th>
                        <th>Unit</th>
                        <th>Metode Agregasi</th>
                        <th>Target Bulanan</th>
                        <th>Realisasi Kumulatif</th>
                        <th>Pencapaian (%)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDivisionKpis(selectedDivision).map(kpi => {
                        const target = getKpiTarget(kpi.code, 'monthly');
                        const realization = calculateRealization(kpi.code, selectedDate);
                        
                        let percentage = 0;
                        if (target > 0) {
                          if (kpi.code.includes('SAIDI') || kpi.code.includes('SAIFI') || kpi.code.includes('K3_INCIDENT')) {
                            percentage = realization === 0 ? 100 : Math.max(0, Math.min(100, (target / realization) * 100));
                          } else {
                            percentage = Math.max(0, Math.min(120, (realization / target) * 100));
                          }
                        } else {
                          percentage = realization > 0 ? 100 : 0;
                        }
                        
                        const score = Math.round(percentage);
                        const statusColor = getStatusColorClass(score);

                        return (
                          <tr key={kpi.code}>
                            <td style={{ fontWeight: 'bold' }}>{kpi.code}</td>
                            <td>{kpi.name}</td>
                            <td>{kpi.unit}</td>
                            <td>{kpi.aggregationMethod}</td>
                            <td style={{ fontWeight: '600' }}>{target}</td>
                            <td style={{ fontWeight: '600', color: 'var(--pln-blue)' }}>{realization}</td>
                            <td style={{ fontWeight: '700' }}>{score}%</td>
                            <td>
                              <span className={`badge-status ${statusColor}`}>{getStatusLabel(score)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

                {/* TAB X: TEKNIK */}
                {activeTab === 'tech' && (
                  <div className="tech-page">
                    <div className="page-header">
                      <h2>Monitoring Bidang Teknik</h2>
                      <p>Real-time status pemeliharaan dan perbaikan jaringan distribusi.</p>
                    </div>

                    <div className="overview-top-grid">
                      <div className="kpi-summary-grid">
                        <div className="kpi-card kpi-workorders">
                          <div className="kpi-label">WORK ORDERS</div>
                          <div className="kpi-value">215</div>
                          <div className="kpi-sub">+8% vs last week</div>
                        </div>

                        <div className="kpi-card kpi-completed">
                          <div className="kpi-label">COMPLETED WO</div>
                          <div className="kpi-value">180</div>
                          <div className="kpi-sub">83% Success Rate</div>
                        </div>

                        <div className="kpi-card kpi-active">
                          <div className="kpi-label">ACTIVE WO</div>
                          <div className="kpi-value">25</div>
                          <div className="kpi-sub">In Progress · 12 Teams Assigned</div>
                        </div>

                        <div className="kpi-card kpi-sla">
                          <div className="kpi-label">SLA ACHIEVEMENT</div>
                          <div className="kpi-value">92%</div>
                          <div className="kpi-sub">Above target (90%)</div>
                        </div>

                        <div className="kpi-card kpi-delayed">
                          <div className="kpi-label">DELAYED TASKS</div>
                          <div className="kpi-value">10</div>
                          <div className="kpi-sub">+2 from yesterday</div>
                        </div>
                      </div>
                    </div>

                    <div className="tech-main-grid">
                      <div className="left-column">
                        <div className="chart-card">
                          <div className="chart-header">
                            <div className="chart-title">
                              <h3>Work Order Progress</h3>
                            </div>
                          </div>
                          <div className="progress-list">
                            {[
                              {label: 'Planning & Material', pct: 95},
                              {label: 'Field Execution', pct: 68},
                              {label: 'Reporting & Verification', pct: 42},
                              {label: 'System Updates', pct: 30}
                            ].map(item => (
                              <div key={item.label} className="progress-row">
                                <div className="progress-label">{item.label}</div>
                                <div className="progress-bar-wrap">
                                  <div className="progress-track"><div className="progress-fill" style={{ width: item.pct + '%' }} /></div>
                                  <div className="progress-pct">{item.pct}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="chart-card">
                          <div className="chart-header">
                            <div className="chart-title">
                              <h3>Daily Technical Activities</h3>
                            </div>
                            <div className="chart-controls">
                              <select className="chart-select"><option>Last 7 Days</option></select>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                              <LineChart data={getTrendChartData()} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                                <Line type="monotone" dataKey={getDivisionKpis(selectedDivision)[0]?.name.split(' (')[0]} stroke="#2f66b3" strokeWidth={3} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="right-column">
                        <div className="chart-card">
                          <div className="chart-header">
                            <div className="chart-title"><h3>Work Order List</h3></div>
                            <div className="chart-controls">
                              <select value={woFilterStatus} onChange={(e) => { setWoFilterStatus(e.target.value); setWoPage(1); }} className="chart-select">
                                <option value="All">All</option>
                                {Array.from(new Set(workOrders.map(w => w.status))).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input className="chart-search" placeholder="Search WO, lokasi, staff..." value={woSearch} onChange={(e) => { setWoSearch(e.target.value); setWoPage(1); }} />
                              <button className="btn-link" onClick={() => handleExportCsv(filteredWorkOrders)}>Export CSV</button>
                            </div>
                          </div>
                          <div className="data-table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>WO ID</th>
                                  <th>LOCATION</th>
                                  <th>ASSIGNED STAFF</th>
                                  <th>DEADLINE</th>
                                  <th>STATUS</th>
                                  <th>ACTIONS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {woPageItems.map(row => (
                                  <tr key={row.id}>
                                    <td style={{ fontWeight: 700 }}>{row.id}</td>
                                    <td>{row.loc}</td>
                                    <td>{row.staff}</td>
                                    <td>{row.dl}</td>
                                    <td><span className={`badge-status ${row.status === 'Delayed' ? 'red' : row.status === 'New' ? 'yellow' : 'green'}`}>{row.status}</span></td>
                                    <td><button className="btn-link" onClick={() => triggerAlert('Membuka WO '+row.id,'info')}>...</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

          {/* TAB 4: PELAYANAN PELANGGAN */}
          {activeTab === 'customer' && customerDivision && (
            <div className="customer-page">
              <div className="customer-hero">
                <div>
                  <h2>Bidang Pelayanan Pelanggan</h2>
                  <p>Real-time monitoring of customer service metrics and complaint resolution.</p>
                </div>
              </div>

              <div className="customer-metrics-grid">
                {customerMetricCards.map(card => (
                  <div key={card.title} className={`customer-metric-card ${card.accent}`}>
                    <div className="customer-metric-head">
                      <span>{card.title}</span>
                      <span className={`customer-metric-icon ${card.icon}`} />
                    </div>
                    <div className="customer-metric-value">{card.value}{card.title === 'SLA Achievement' ? '%' : ''}</div>
                    <div className="customer-metric-subtitle">{card.subtitle}</div>
                    <div className="customer-metric-bar"><span /></div>
                  </div>
                ))}
              </div>

              <div className="customer-main-grid">
                <div className="chart-card customer-chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <h3>Complaint Trends</h3>
                      <p>Daily volume across 7 days</p>
                    </div>
                    <select className="chart-select">
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div style={{ width: '100%', height: 330 }}>
                    <ResponsiveContainer>
                      <LineChart data={customerTrendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                        <Line type="monotone" dataKey="value" stroke="#2f5ea8" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card customer-category-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <h3>Complaint Categories</h3>
                      <p>Volume distribution</p>
                    </div>
                  </div>
                  <div className="customer-category-visual">
                    <div className="customer-category-square">
                      <div className="customer-category-inner">
                        <div className="customer-category-total">85</div>
                        <div className="customer-category-label">Total</div>
                      </div>
                    </div>
                  </div>
                  <div className="customer-category-legend">
                    {customerCategories.map(category => (
                      <div key={category.name} className="customer-category-row">
                        <span className="customer-category-dot" style={{ backgroundColor: category.color }} />
                        <span className="customer-category-name">{category.name}</span>
                        <span className="customer-category-value">{category.value} ({category.percent}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header" style={{ marginBottom: '16px' }}>
                  <div className="chart-title">
                    <h3>Ticket List</h3>
                    <p>Daily activity and complaint handling</p>
                  </div>
                  <div className="chart-controls">
                    <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} type="button">Filter</button>
                    <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} type="button">Export</button>
                  </div>
                </div>

                <div className="data-table-container">
                  <table className="data-table customer-ticket-table">
                    <thead>
                      <tr>
                        <th>Ticket Number</th>
                        <th>Customer</th>
                        <th>Assigned Staff</th>
                        <th>Status</th>
                        <th>Resolution Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerTickets.map(ticket => (
                        <tr key={ticket.ticket}>
                          <td style={{ fontWeight: '700' }}>{ticket.ticket}</td>
                          <td>{ticket.customer}</td>
                          <td>{ticket.staff}</td>
                          <td>
                            <span className={`badge-status ${ticket.status === 'Critical' ? 'red' : ticket.status === 'Pending' ? 'yellow' : 'green'}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td>{ticket.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="chart-card">
              <div className="chart-header" style={{ marginBottom: '24px' }}>
                <div className="chart-title">
                  <h3>Log Riwayat Audit Perubahan Data</h3>
                  <p>Mencatat secara detail aktivitas pengisian dan perubahan data KPI: siapa, mengubah apa, kapan.</p>
                </div>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Log</th>
                      <th>User</th>
                      <th>Aksi</th>
                      <th>Tabel Referensi</th>
                      <th>Nama Record</th>
                      <th>Rincian Aktivitas</th>
                      <th>Waktu Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>#{log.id}</td>
                        <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{log.user}</td>
                        <td>
                          <span 
                            className="badge-status" 
                            style={{ 
                              backgroundColor: log.action === 'CREATE' ? 'var(--color-green-bg)' : 'var(--color-yellow-bg)', 
                              color: log.action === 'CREATE' ? 'var(--color-green)' : 'var(--color-yellow)',
                              border: log.action === 'CREATE' ? '1px solid var(--color-green-border)' : '1px solid var(--color-yellow-border)',
                              fontSize: '0.65rem'
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td><code>{log.tableName}</code></td>
                        <td>{log.record}</td>
                        <td style={{ color: 'var(--text-heading)', fontWeight: '500' }}>{log.details}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
