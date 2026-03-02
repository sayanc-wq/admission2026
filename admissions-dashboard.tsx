import { useState, useMemo, useCallback } from "react";

const MONTHS = ["Jan","Feb","March","April","May","June","July","August"];
const MONTH_TARGETS_MAIN = {Jan:10,Feb:15,March:20,April:25,May:40,June:40,July:35,August:25};
const MONTH_TARGETS_ECOLE = {Jan:0,Feb:8,March:10,April:12,May:18,June:20,July:18,August:14};

const COUNSELORS = [
  { id:"c1", name:"Projaini", avatar:"PR", group:"main", totalTarget:210 },
  { id:"c2", name:"Aditi", avatar:"AD", group:"main", totalTarget:210 },
  { id:"c3", name:"Moumita", avatar:"MO", group:"main", totalTarget:210 },
  { id:"c4", name:"Riya", avatar:"RI", group:"main", totalTarget:210 },
  { id:"c5", name:"Mampi", avatar:"MA", group:"main", totalTarget:210 },
  { id:"c6", name:"Hritika", avatar:"HR", group:"main", totalTarget:210 },
  { id:"c7", name:"Amit", avatar:"AM", group:"main", totalTarget:210 },
  { id:"c8", name:"Robert", avatar:"RO", group:"ecole", totalTarget:100 },
];

const getWeeksInMonth = (m) => {
  const map = { Jan:4, Feb:4, March:5, April:4, May:5, June:4, July:5, August:4 };
  return map[m] || 4;
};

const distributeTarget = (monthTarget, weeks) => {
  if (!monthTarget) return Array(weeks).fill(0);
  const base = Math.floor(monthTarget / weeks);
  const rem = monthTarget % weeks;
  return Array.from({ length: weeks }, (_, i) => base + (i < rem ? 1 : 0));
};

const initWeeklyData = () => {
  const d = {};
  COUNSELORS.forEach(c => {
    d[c.id] = {};
    const mt = c.group === "ecole" ? MONTH_TARGETS_ECOLE : MONTH_TARGETS_MAIN;
    MONTHS.forEach(m => {
      const weeks = getWeeksInMonth(m);
      const wTargets = distributeTarget(mt[m], weeks);
      d[c.id][m] = Array.from({ length: weeks }, (_, i) => ({
        weekNum: i + 1,
        target: wTargets[i],
        achieved: 0,
      }));
    });
  });
  return d;
};

const ProgressBar = ({ pct, h = 8 }) => {
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#84cc16" : pct >= 50 ? "#f59e0b" : pct >= 25 ? "#f97316" : "#ef4444";
  return (
    <div style={{ height: h, background: "#e2e8f0", borderRadius: h / 2, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: h / 2, transition: "width 0.4s" }} />
    </div>
  );
};

const pctColor = (p) => p >= 90 ? "#22c55e" : p >= 70 ? "#84cc16" : p >= 50 ? "#f59e0b" : p >= 25 ? "#f97316" : "#ef4444";
const statusBadge = (p) => {
  const c = p >= 90 ? { bg: "#dcfce7", fg: "#16a34a", t: "On Track" } : p >= 70 ? { bg: "#fef9c3", fg: "#a16207", t: "Needs Push" } : p >= 50 ? { bg: "#ffedd5", fg: "#c2410c", t: "Behind" } : { bg: "#fee2e2", fg: "#dc2626", t: "Critical" };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: c.bg, color: c.fg, whiteSpace: "nowrap" }}>{c.t}</span>;
};

export default function Dashboard() {
  const [weeklyData, setWeeklyData] = useState(initWeeklyData);
  const [tab, setTab] = useState("input");
  const [selMonth, setSelMonth] = useState("March");
  const [selCounselor, setSelCounselor] = useState("all");
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [reminders, setReminders] = useState([]);
  const [toast, setToast] = useState(null);
  const [showRemindModal, setShowRemindModal] = useState(null);
  const [reminderType, setReminderType] = useState("performance");
  const [customMsg, setCustomMsg] = useState("");
  const [detailC, setDetailC] = useState(null);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const handleCellClick = (cId, month, weekIdx, field) => {
    const key = `${cId}-${month}-${weekIdx}-${field}`;
    setEditCell(key);
    setEditVal(String(weeklyData[cId][month][weekIdx][field]));
  };

  const handleCellSave = (cId, month, weekIdx, field) => {
    const val = Math.max(0, parseInt(editVal) || 0);
    setWeeklyData(prev => {
      const n = { ...prev };
      n[cId] = { ...n[cId] };
      n[cId][month] = [...n[cId][month]];
      n[cId][month][weekIdx] = { ...n[cId][month][weekIdx], [field]: val };
      return n;
    });
    setEditCell(null);
  };

  const handleKeyDown = (e, cId, month, weekIdx, field) => {
    if (e.key === "Enter") handleCellSave(cId, month, weekIdx, field);
    if (e.key === "Escape") setEditCell(null);
  };

  const getStats = useCallback((cId) => {
    const cd = weeklyData[cId];
    if (!cd) return { totalTarget: 0, totalAchieved: 0, pct: 0, monthStats: {} };
    let tT = 0, tA = 0;
    const monthStats = {};
    MONTHS.forEach(m => {
      const weeks = cd[m] || [];
      const mT = weeks.reduce((s, w) => s + w.target, 0);
      const mA = weeks.reduce((s, w) => s + w.achieved, 0);
      tT += mT;
      tA += mA;
      monthStats[m] = { target: mT, achieved: mA, pct: mT ? (mA / mT * 100) : 0 };
    });
    return { totalTarget: tT, totalAchieved: tA, pct: tT ? (tA / tT * 100) : 0, monthStats };
  }, [weeklyData]);

  const overallStats = useMemo(() => {
    let tT = 0, tA = 0;
    COUNSELORS.forEach(c => {
      const s = getStats(c.id);
      tT += s.totalTarget;
      tA += s.totalAchieved;
    });
    return { totalTarget: tT, totalAchieved: tA, pct: tT ? (tA / tT * 100) : 0, remaining: tT - tA };
  }, [getStats]);

  const sendReminder = (counselor) => {
    const st = getStats(counselor.id);
    const ms = st.monthStats[selMonth] || { target: 0, achieved: 0, pct: 0 };
    const templates = {
      performance: `Hi ${counselor.name},\n\nWeekly Performance Summary:\n• ${selMonth} Target: ${ms.target} | Achieved: ${ms.achieved} (${ms.pct.toFixed(0)}%)\n• Overall: ${st.totalAchieved}/${st.totalTarget} (${st.pct.toFixed(0)}%)\n• Gap: ${st.totalTarget - st.totalAchieved} remaining\n\nPlease prioritize pending follow-ups.\n\n— Admissions Head`,
      followup: `Hi ${counselor.name},\n\nYou are at ${ms.pct.toFixed(0)}% of your ${selMonth} target (${ms.achieved}/${ms.target}). ${ms.target - ms.achieved} admissions remaining this month.\n\nPlease clear your pipeline.\n\n— Admissions Head`,
      target: `Hi ${counselor.name},\n\nYour overall achievement: ${st.pct.toFixed(0)}% (${st.totalAchieved}/${st.totalTarget}). ${st.pct < 70 ? "This needs urgent attention." : "Keep pushing."}\n\n— Admissions Head`,
      custom: customMsg,
    };
    setReminders(prev => [{ id: Date.now(), to: counselor.name, type: reminderType, message: templates[reminderType], sentAt: new Date().toLocaleString() }, ...prev]);
    showToast(`📧 Reminder sent to ${counselor.name}`);
    setShowRemindModal(null);
    setReminderType("performance");
    setCustomMsg("");
  };

  const sendBulk = () => {
    const newR = COUNSELORS.map(c => {
      const st = getStats(c.id);
      const ms = st.monthStats[selMonth] || {};
      return { id: Date.now() + Math.random(), to: c.name, type: "performance", message: `Hi ${c.name}, ${selMonth}: ${ms.achieved||0}/${ms.target||0} (${(ms.pct||0).toFixed(0)}%) | Overall: ${st.totalAchieved}/${st.totalTarget} (${st.pct.toFixed(0)}%). Update your pipeline.`, sentAt: new Date().toLocaleString() };
    });
    setReminders(prev => [...newR, ...prev]);
    showToast(`📧 Sent to all ${COUNSELORS.length} counselors`);
  };

  const resetData = () => { setWeeklyData(initWeeklyData()); showToast("Data reset to defaults"); };

  const S = {
    page: { fontFamily: "'Segoe UI',system-ui,sans-serif", background: "#f1f5f9", minHeight: "100vh", color: "#1e293b" },
    header: { background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: "18px 24px", color: "white" },
    tabs: { display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" },
    tab: (a) => ({ padding: "7px 15px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: a ? "white" : "rgba(255,255,255,0.1)", color: a ? "#1e3a5f" : "#93c5fd" }),
    body: { padding: "18px 24px", maxWidth: 1280, margin: "0 auto" },
    card: { background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 14 },
    btn: (bg) => ({ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "white", background: bg || "#3b82f6" }),
    btnSm: (bg) => ({ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "white", background: bg || "#3b82f6" }),
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalBox: { background: "white", borderRadius: 16, padding: 24, width: "92%", maxWidth: 480, maxHeight: "85vh", overflow: "auto" },
    select: { padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" },
    input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" },
    toast: { position: "fixed", top: 16, right: 16, background: "#22c55e", color: "white", padding: "10px 18px", borderRadius: 10, fontWeight: 600, fontSize: 13, zIndex: 2000, boxShadow: "0 4px 12px rgba(34,197,94,0.3)" },
    label: { fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 },
    editableCell: { cursor: "pointer", padding: "6px 8px", borderRadius: 4, minWidth: 36, textAlign: "center", transition: "background 0.15s" },
  };

  const filteredCounselors = selCounselor === "all" ? COUNSELORS : COUNSELORS.filter(c => c.id === selCounselor);

  return (
    <div style={S.page}>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📊 Admissions Command Center</h1>
            <p style={{ fontSize: 12, color: "#93c5fd", margin: "3px 0 0" }}>AY 2025-26 • Total Target: <strong>1,570</strong> • Manual Weekly Entry</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={S.btn("#f59e0b")} onClick={sendBulk}>📧 Bulk Remind All</button>
            <button style={S.btn("#64748b")} onClick={resetData}>↻ Reset</button>
          </div>
        </div>
        <div style={S.tabs}>
          {[["input", "✏️ Weekly Input"], ["overview", "📈 Overview"], ["counselors", "👥 Counselors"], ["leaderboard", "🏆 Leaderboard"], ["reminders", "📧 Reminders"]].map(([k, l]) => (
            <button key={k} style={S.tab(tab === k)} onClick={() => { setTab(k); setDetailC(null); }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={S.body}>

        {/* WEEKLY INPUT */}
        {tab === "input" && <>
          <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Month:</span>
            {MONTHS.map(m => (
              <button key={m} onClick={() => setSelMonth(m)} style={{ padding: "5px 12px", borderRadius: 8, border: selMonth === m ? "2px solid #3b82f6" : "1px solid #d1d5db", background: selMonth === m ? "#eff6ff" : "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: selMonth === m ? "#3b82f6" : "#475569" }}>{m}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Counselor:</span>
              <select style={S.select} value={selCounselor} onChange={e => setSelCounselor(e.target.value)}>
                <option value="all">All Counselors</option>
                {COUNSELORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            💡 <em>Click any <strong style={{ color: "#3b82f6" }}>Target</strong> or <strong style={{ color: "#22c55e" }}>Achieved</strong> cell to edit. Press Enter to save, Escape to cancel.</em>
          </div>

          {filteredCounselors.map(c => {
            const weeks = weeklyData[c.id]?.[selMonth] || [];
            const mTarget = weeks.reduce((s, w) => s + w.target, 0);
            const mAchieved = weeks.reduce((s, w) => s + w.achieved, 0);
            const mPct = mTarget ? (mAchieved / mTarget * 100) : 0;
            return (
              <div key={c.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${pctColor(mPct)},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700 }}>{c.avatar}</div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                      {c.group === "ecole" && <span style={{ fontSize: 10, background: "#ede9fe", color: "#6366f1", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>ECOLE</span>}
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{selMonth}: {mAchieved}/{mTarget} ({mPct.toFixed(0)}%)</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {statusBadge(mPct)}
                    <button style={S.btnSm("#6366f1")} onClick={() => setShowRemindModal(c)}>📧</button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: "2px solid #e2e8f0", fontSize: 12 }}>Week</th>
                        <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0", fontSize: 12, color: "#3b82f6" }}>🎯 Target</th>
                        <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0", fontSize: 12, color: "#22c55e" }}>✅ Achieved</th>
                        <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0", fontSize: 12 }}>Gap</th>
                        <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0", fontSize: 12 }}>%</th>
                        <th style={{ padding: "8px 10px", borderBottom: "2px solid #e2e8f0", fontSize: 12, minWidth: 80 }}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeks.map((w, i) => {
                        const gap = w.target - w.achieved;
                        const wPct = w.target ? (w.achieved / w.target * 100) : 0;
                        const tKey = `${c.id}-${selMonth}-${i}-target`;
                        const aKey = `${c.id}-${selMonth}-${i}-achieved`;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 600 }}>W{w.weekNum}</td>
                            <td style={{ padding: "4px 6px", textAlign: "center" }}>
                              {editCell === tKey ? (
                                <input type="number" min="0" value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => handleCellSave(c.id, selMonth, i, "target")} onKeyDown={e => handleKeyDown(e, c.id, selMonth, i, "target")} autoFocus style={{ width: 52, padding: "4px 6px", borderRadius: 4, border: "2px solid #3b82f6", fontSize: 13, textAlign: "center", outline: "none" }} />
                              ) : (
                                <div onClick={() => handleCellClick(c.id, selMonth, i, "target")} style={{ ...S.editableCell, color: "#3b82f6", fontWeight: 700, background: "#eff6ff" }} title="Click to edit target">{w.target}</div>
                              )}
                            </td>
                            <td style={{ padding: "4px 6px", textAlign: "center" }}>
                              {editCell === aKey ? (
                                <input type="number" min="0" value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => handleCellSave(c.id, selMonth, i, "achieved")} onKeyDown={e => handleKeyDown(e, c.id, selMonth, i, "achieved")} autoFocus style={{ width: 52, padding: "4px 6px", borderRadius: 4, border: "2px solid #22c55e", fontSize: 13, textAlign: "center", outline: "none" }} />
                              ) : (
                                <div onClick={() => handleCellClick(c.id, selMonth, i, "achieved")} style={{ ...S.editableCell, color: "#22c55e", fontWeight: 700, background: "#f0fdf4" }} title="Click to edit achieved">{w.achieved}</div>
                              )}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: gap > 0 ? "#ef4444" : gap === 0 ? "#94a3b8" : "#22c55e" }}>{gap > 0 ? `-${gap}` : gap === 0 ? "—" : `+${Math.abs(gap)}`}</td>
                            <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: pctColor(wPct), fontSize: 12 }}>{w.target ? `${wPct.toFixed(0)}%` : "—"}</td>
                            <td style={{ padding: "8px 10px" }}><ProgressBar pct={wPct} h={7} /></td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: "#f8fafc", fontWeight: 700, fontSize: 12 }}>
                        <td style={{ padding: "8px 10px" }}>TOTAL</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#3b82f6" }}>{mTarget}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#22c55e" }}>{mAchieved}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: mTarget - mAchieved > 0 ? "#ef4444" : "#22c55e" }}>{mTarget - mAchieved > 0 ? `-${mTarget - mAchieved}` : mTarget === mAchieved ? "—" : `+${mAchieved - mTarget}`}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: pctColor(mPct) }}>{mPct.toFixed(0)}%</td>
                        <td style={{ padding: "8px 10px" }}><ProgressBar pct={mPct} h={7} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>}

        {/* OVERVIEW */}
        {tab === "overview" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { l: "Annual Target", v: overallStats.totalTarget, c: "#3b82f6", i: "🎯" },
              { l: "Total Achieved", v: overallStats.totalAchieved, c: "#22c55e", i: "✅" },
              { l: "Remaining", v: overallStats.remaining, c: "#ef4444", i: "⏳" },
              { l: "Overall %", v: `${overallStats.pct.toFixed(1)}%`, c: pctColor(overallStats.pct), i: "📈" },
            ].map((item, i) => (
              <div key={i} style={{ ...S.card, borderLeft: `4px solid ${item.c}`, marginBottom: 0 }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{item.i} {item.l}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: item.c, marginTop: 4 }}>{item.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
            <div style={S.card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>📅 Monthly Breakdown</h3>
              {MONTHS.map(m => {
                const mT = COUNSELORS.reduce((s, c) => s + (weeklyData[c.id]?.[m] || []).reduce((ss, w) => ss + w.target, 0), 0);
                const mA = COUNSELORS.reduce((s, c) => s + (weeklyData[c.id]?.[m] || []).reduce((ss, w) => ss + w.achieved, 0), 0);
                const p = mT ? (mA / mT * 100) : 0;
                return (
                  <div key={m} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{m}</span>
                      <span style={{ color: pctColor(p) }}>{mA}/{mT} ({p.toFixed(0)}%)</span>
                    </div>
                    <ProgressBar pct={p} h={8} />
                  </div>
                );
              })}
            </div>
            <div style={S.card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>👥 Counselor Summary</h3>
              {COUNSELORS.map(c => {
                const st = getStats(c.id);
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${pctColor(st.pct)},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: pctColor(st.pct) }}>{st.totalAchieved}/{st.totalTarget} ({st.pct.toFixed(0)}%)</span>
                      </div>
                      <ProgressBar pct={st.pct} h={6} />
                    </div>
                    {statusBadge(st.pct)}
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {/* COUNSELORS DETAIL */}
        {tab === "counselors" && <>
          {detailC ? (
            <div>
              <button style={{ ...S.btn("#64748b"), marginBottom: 12 }} onClick={() => setDetailC(null)}>← Back</button>
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 }}>{detailC.avatar}</div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18 }}>{detailC.name} {detailC.group === "ecole" && <span style={{ fontSize: 11, background: "#ede9fe", color: "#6366f1", padding: "2px 6px", borderRadius: 4 }}>ECOLE</span>}</h2>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Annual Target: {detailC.totalTarget}</p>
                    </div>
                  </div>
                  <button style={S.btn("#6366f1")} onClick={() => setShowRemindModal(detailC)}>📧 Send Reminder</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>Month</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>Target</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>Achieved</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>Gap</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>%</th>
                      <th style={{ padding: "8px 10px", borderBottom: "2px solid #e2e8f0" }}>Progress</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map(m => {
                      const ms = getStats(detailC.id).monthStats[m];
                      const gap = ms.target - ms.achieved;
                      return (
                        <tr key={m} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 600 }}>{m}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>{ms.target}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#22c55e" }}>{ms.achieved}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: gap > 0 ? "#ef4444" : "#22c55e" }}>{gap > 0 ? `-${gap}` : gap === 0 ? "—" : `+${Math.abs(gap)}`}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: pctColor(ms.pct) }}>{ms.pct.toFixed(0)}%</td>
                          <td style={{ padding: "8px 10px", width: 100 }}><ProgressBar pct={ms.pct} h={8} /></td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>{statusBadge(ms.pct)}</td>
                        </tr>
                      );
                    })}
                    {(() => {
                      const st = getStats(detailC.id);
                      return (
                        <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                          <td style={{ padding: "8px 10px" }}>TOTAL</td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>{st.totalTarget}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center", color: "#22c55e" }}>{st.totalAchieved}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center", color: st.totalTarget - st.totalAchieved > 0 ? "#ef4444" : "#22c55e" }}>{st.totalTarget - st.totalAchieved > 0 ? `-${st.totalTarget - st.totalAchieved}` : "✓"}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center", color: pctColor(st.pct) }}>{st.pct.toFixed(0)}%</td>
                          <td colSpan={2} />
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {COUNSELORS.map(c => {
                const st = getStats(c.id);
                return (
                  <div key={c.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 0 }} onClick={() => setDetailC(c)}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${pctColor(st.pct)},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name} {c.group === "ecole" && <span style={{ fontSize: 10, background: "#ede9fe", color: "#6366f1", padding: "1px 6px", borderRadius: 4 }}>ECOLE</span>}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Overall: {st.totalAchieved}/{st.totalTarget} ({st.pct.toFixed(0)}%)</div>
                    </div>
                    <div style={{ width: 120 }}><ProgressBar pct={st.pct} h={8} /></div>
                    {statusBadge(st.pct)}
                    <button style={S.btnSm("#6366f1")} onClick={e => { e.stopPropagation(); setShowRemindModal(c); }}>📧</button>
                  </div>
                );
              })}
            </div>
          )}
        </>}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (
          <div style={S.card}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>🏆 Counselor Leaderboard — Overall %</h3>
            {[...COUNSELORS].sort((a, b) => getStats(b.id).pct - getStats(a.id).pct).map((c, i) => {
              const st = getStats(c.id);
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < COUNSELORS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <span style={{ fontSize: i < 3 ? 22 : 15, width: 32, textAlign: "center", fontWeight: 700, color: i >= 3 ? "#94a3b8" : undefined }}>{medal}</span>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${pctColor(st.pct)},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{c.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{st.totalAchieved}/{st.totalTarget}</div>
                  </div>
                  <div style={{ width: 120 }}><ProgressBar pct={st.pct} h={9} /></div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: pctColor(st.pct), minWidth: 45, textAlign: "right" }}>{st.pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}

        {/* REMINDERS */}
        {tab === "reminders" && <>
          <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>📧 Reminder Log ({reminders.length})</h3>
            <button style={S.btn("#f59e0b")} onClick={sendBulk}>Send to All</button>
          </div>
          {reminders.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: 36, color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 6 }}>📭</div>
              <p style={{ margin: 0 }}>No reminders yet.</p>
            </div>
          ) : reminders.map(r => (
            <div key={r.id} style={{ ...S.card, borderLeft: "4px solid #6366f1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                <strong>{r.to}</strong>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.sentAt}</span>
              </div>
              <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#ede9fe", color: "#6366f1" }}>{r.type.toUpperCase()}</span>
              <p style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.6, whiteSpace: "pre-line" }}>{r.message}</p>
            </div>
          ))}
        </>}
      </div>

      {/* REMINDER MODAL */}
      {showRemindModal && (
        <div style={S.modal} onClick={() => setShowRemindModal(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 14px" }}>📧 Remind {showRemindModal.name}</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Type</label>
              <select style={{ ...S.select, width: "100%" }} value={reminderType} onChange={e => setReminderType(e.target.value)}>
                <option value="performance">📊 Performance Summary</option>
                <option value="followup">🔄 Follow-up Alert</option>
                <option value="target">🎯 Target Review</option>
                <option value="custom">✏️ Custom</option>
              </select>
            </div>
            {reminderType === "custom" && (
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Message</label>
                <textarea style={{ ...S.input, height: 80, resize: "vertical" }} value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Type message..." />
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button style={S.btn("#94a3b8")} onClick={() => setShowRemindModal(null)}>Cancel</button>
              <button style={S.btn("#6366f1")} onClick={() => sendReminder(showRemindModal)}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
