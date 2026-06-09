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
import './App.css';

export default function App() {
  // Application state
  const [divisions] = useState(initialDivisions);
  const [kpis, setKpis] = useState(initialKpis);
  const [targets, setTargets] = useState(initialTargets);
  const [dailyInputs, setDailyInputs] = useState(initialDailyInputs);
  const [logs, setLogs] = useState(initialLogs);
  
  // Navigation & UI controls
  const [activeTab, setActiveTab] = useState('overview'); // overview, input, target, logs
  const [selectedDivision, setSelectedDivision] = useState(1); // 1 = Teknik, etc.
  const [currentUserRole, setCurrentUserRole] = useState('PIC'); // Admin, PIC, Viewer
  const [selectedDate, setSelectedDate] = useState('2026-06-07');
  const [darkTheme, setDarkTheme] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  // Format month and year from selectedDate
  const getYearMonth = () => {
    const d = new Date(selectedDate);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1
    };
  };

  // Enforce H-7 backdated input validation
  const validateDateForInput = (dateStr) => {
    const inputDate = new Date(dateStr);
    const today = new Date('2026-06-08'); // System fixed baseline date for demo
    
    // Calculate difference in days
    const diffTime = today.getTime() - inputDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Allow inputs between today and 7 days back (0 to 7 days ago)
    return diffDays >= 0 && diffDays <= 7;
  };

  // Trigger temporary notification banners
  const triggerAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Toggle dark/light theme
  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
    document.body.classList.toggle('dark-theme');
  };

  // Helper: Get Division KPI Indicators
  const getDivisionKpis = (divId) => {
    return kpis.filter(k => k.divisionId === divId);
  };

  // Logic: Calculate cumulative realization for a KPI in the selected month
  const calculateRealization = (kpiCode, upToDateStr) => {
    const { year, month } = getYearMonth();
    const kpi = kpis.find(k => k.code === kpiCode);
    if (!kpi) return 0;

    const prefix = `${kpiCode}_`;
    const monthKeys = Object.keys(dailyInputs).filter(key => {
      if (!key.startsWith(prefix)) return false;
      const keyDateStr = key.replace(prefix, '');
      const keyDate = new Date(keyDateStr);
      const limitDate = new Date(upToDateStr);
      return (
        keyDate.getFullYear() === year &&
        (keyDate.getMonth() + 1) === month &&
        keyDate.getTime() <= limitDate.getTime()
      );
    });

    if (monthKeys.length === 0) return 0;

    if (kpi.aggregationMethod === 'SUM') {
      return monthKeys.reduce((sum, key) => sum + (dailyInputs[key]?.value || 0), 0);
    } else {
      // LATEST: Sort by date descending and get the newest entry
      monthKeys.sort((a, b) => b.localeCompare(a));
      return dailyInputs[monthKeys[0]]?.value || 0;
    }
  };

  // Logic: Get KPI Target (Monthly or Yearly)
  const getKpiTarget = (kpiCode, period = 'monthly') => {
    const { year, month } = getYearMonth();
    const targetKey = period === 'monthly' 
      ? `${kpiCode}_${year}_${month}` 
      : `${kpiCode}_${year}_0`;
    
    return targets[targetKey] !== undefined ? targets[targetKey] : 0;
  };

  // Logic: Calculate Division Cumulative Achievement Score
  const calculateDivisionScore = (divId, dateStr) => {
    const divKpis = getDivisionKpis(divId);
    if (divKpis.length === 0) return 0;

    let totalPercentage = 0;
    divKpis.forEach(kpi => {
      const target = getKpiTarget(kpi.code, 'monthly');
      const realization = calculateRealization(kpi.code, dateStr);
      
      let percentage = 0;
      if (target > 0) {
        if (kpi.code.includes('SAIDI') || kpi.code.includes('SAIFI') || kpi.code.includes('K3_INCIDENT')) {
          // Inverse metric: Lower is better
          percentage = realization === 0 ? 100 : Math.max(0, Math.min(100, (target / realization) * 100));
        } else {
          percentage = Math.max(0, Math.min(120, (realization / target) * 100));
        }
      } else {
        percentage = realization > 0 ? 100 : 0;
      }
      totalPercentage += percentage;
    });

    return Math.round(totalPercentage / divKpis.length);
  };

  // Color Coding Rules: Green >=90% | Yellow 70–89% | Red <70%
  const getStatusColorClass = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getStatusLabel = (score) => {
    if (score >= 90) return 'Baik (Hijau)';
    if (score >= 70) return 'Cukup (Kuning)';
    return 'Kurang (Merah)';
  };

  // Custom division icons
  const getDivisionIcon = (divId) => {
    switch (divId) {
      case 1: return <Activity size={20} />;
      case 2: return <ShoppingBag size={20} />;
      case 3: return <Layers size={20} />;
      case 4: return <Briefcase size={20} />;
      case 5: return <Users2 size={20} />;
      case 6: return <Wallet size={20} />;
      default: return <Building size={20} />;
    }
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

  const plnScore = calculatePLNScore();

  return (
    <div className="app-container">
      {/* Sidebar Layout */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-bolt">⚡</div>
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
              <span>Konfigurasi Target</span>
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('logs')}>
              <History size={18} />
              <span>Audit Log Perubahan</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <p>© 2026 PLN UP3 - Planning Division</p>
          <p style={{ marginTop: '4px', fontSize: '0.65rem' }}>Intern Project Scope</p>
        </div>
      </aside>

      {/* Main Container */}
      <main className="app-content">
        {/* Header Layout */}
        <header className="app-header">
          <div className="header-title">
            <h1>Dashboard Monitoring Kinerja UP3</h1>
            <p>Sistem Pengawasan KPI Operasional Harian - Divisi Perencanaan</p>
          </div>

          <div className="header-actions">
            {/* System Date selector (Simulated Today is June 8, 2026) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} className="text-muted" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max="2026-06-08"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Role switcher for evaluation demo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} className="text-muted" />
              <select 
                className="user-selector"
                value={currentUserRole}
                onChange={(e) => setCurrentUserRole(e.target.value)}
              >
                <option value="Viewer">Role: Viewer (Read-only)</option>
                <option value="PIC">Role: PIC (Input Data)</option>
                <option value="Admin">Role: Admin (Full Access)</option>
              </select>
            </div>

            <span className={`role-badge ${currentUserRole.toLowerCase()}`}>
              {currentUserRole}
            </span>

            {/* Light/Dark Toggle */}
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkTheme ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Global Notifications Alert Banner */}
        {alert.show && (
          <div style={{ padding: '0 32px', marginTop: '16px' }}>
            <div className={`alert-banner ${alert.type} animate-scale`}>
              {alert.type === 'success' && <CheckCircle2 size={16} />}
              {alert.type === 'warning' && <AlertTriangle size={16} />}
              {alert.type === 'info' && <AlertCircle size={16} />}
              <span>{alert.message}</span>
            </div>
          </div>
        )}

        {/* Render Tab Contents */}
        <div className="page-container animate-fade">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Giant aggregate performance banner */}
              <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', background: 'linear-gradient(135deg, #007cc2 0%, #005c9a 100%)', color: 'white', border: 'none' }}>
                <div>
                  <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>Kinerja Total PLN UP3</h2>
                  <p style={{ color: '#e2e8f0', marginTop: '4px' }}>Rata-rata akumulasi pencapaian kinerja dari seluruh divisi operasional.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, textShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{plnScore}%</div>
                  <span className={`badge-status ${getStatusColorClass(plnScore)}`} style={{ fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px' }}>
                    Status: {getStatusLabel(plnScore)}
                  </span>
                </div>
              </div>

              {/* Grid of Division Cards */}
              <div className="dashboard-grid">
                {divisions.map(div => {
                  const score = calculateDivisionScore(div.id, selectedDate);
                  const color = getStatusColorClass(score);

                  return (
                    <div 
                      key={div.id} 
                      className="division-card hover-lift"
                      onClick={() => {
                        setSelectedDivision(div.id);
                        triggerAlert(`Menampilkan grafik tren untuk divisi: ${div.name}`, 'info');
                      }}
                      style={selectedDivision === div.id ? { borderColor: 'var(--pln-blue)', borderWidth: '2px' } : {}}
                    >
                      <div className="card-header-div">
                        <div className="card-title-container">
                          <h3>Divisi {div.name}</h3>
                          <p>{div.description}</p>
                        </div>
                        <div className="card-icon-wrapper" style={{ color: selectedDivision === div.id ? 'white' : 'var(--pln-blue)', backgroundColor: selectedDivision === div.id ? 'var(--pln-blue)' : 'var(--bg-app)' }}>
                          {getDivisionIcon(div.id)}
                        </div>
                      </div>

                      <div className="card-body-div">
                        <div className="progress-stat">
                          <span className="progress-percentage">{score}%</span>
                          <span className={`badge-status ${color}`}>{getStatusLabel(score)}</span>
                        </div>
                        <div className="progress-track">
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${Math.min(100, score)}%`,
                              backgroundColor: `var(--color-${color})`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Graphical Visualization Area */}
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
            </div>
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

          {/* TAB 3: TARGET CONFIGURATION (Admin only) */}
          {activeTab === 'target' && (
            <div className="chart-card">
              <div className="chart-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div className="chart-title">
                  <h3>Konfigurasi Target KPI Bulanan & Tahunan</h3>
                  <p>Hanya Administrator yang memiliki akses untuk mengedit nilai target operasional.</p>
                </div>
              </div>

              {/* Role restriction banner */}
              {currentUserRole !== 'Admin' && (
                <div className="alert-banner warning" style={{ marginBottom: '24px' }}>
                  <AlertTriangle size={18} />
                  <span>Akses Terbatas: Anda login sebagai <b>{currentUserRole}</b>. Silakan ubah Role di pojok kanan atas ke <b>Admin</b> untuk melakukan pengaturan target.</span>
                </div>
              )}

              {/* Division Selector */}
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

              {/* Form Configuration Table */}
              <form onSubmit={handleSaveTargets}>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode KPI</th>
                        <th>Indikator KPI</th>
                        <th>Satuan</th>
                        <th>Target Bulanan berjalan</th>
                        <th>Target Tahunan berjalan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDivisionKpis(selectedDivision).map(kpi => {
                        const monthlyTarget = getKpiTarget(kpi.code, 'monthly');
                        const yearlyTarget = getKpiTarget(kpi.code, 'yearly');

                        return (
                          <tr key={kpi.code}>
                            <td style={{ fontWeight: 'bold' }}>{kpi.code}</td>
                            <td>{kpi.name}</td>
                            <td>{kpi.unit}</td>
                            <td>
                              <input 
                                type="number" 
                                step="any"
                                name={`${kpi.code}_monthly`}
                                className="table-input"
                                placeholder="Target bulanan..."
                                defaultValue={monthlyTarget}
                                disabled={currentUserRole !== 'Admin'}
                                required
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="any"
                                name={`${kpi.code}_yearly`}
                                className="table-input"
                                placeholder="Target tahunan..."
                                defaultValue={yearlyTarget}
                                disabled={currentUserRole !== 'Admin'}
                                required
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={currentUserRole !== 'Admin'}
                  >
                    Perbarui Nilai Target
                  </button>
                </div>
              </form>
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
