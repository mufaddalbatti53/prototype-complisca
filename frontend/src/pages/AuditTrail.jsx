import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Eye,
  X,
  Download,
  Calendar,
  Layers,
  History,
  FileSpreadsheet,
  Printer,
  MapPin
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function AuditTrail() {
  const { auditLog, applications, undertakings, simulatedDate } = useAicte();
  const { role, roleConfig } = useRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [refTypeFilter, setRefTypeFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selected audit entry for inspector modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper to determine region for an event
  const getEventRegion = (evt) => {
    if (evt.region) return evt.region;
    const actor = evt.actorName || '';
    if (actor.includes('RO–West') || actor.includes('Western')) return 'Western Regional Office';
    if (actor.includes('RO–North-Western') || actor.includes('North-Western')) return 'North-Western Regional Office';
    if (actor.includes('RO–North') || actor.includes('Northern')) return 'Northern Regional Office';
    if (actor.includes('RO–South') || actor.includes('Southern')) return 'Southern Regional Office';
    if (actor.includes('RO–Central') || actor.includes('Central')) return 'Central Regional Office';
    if (actor.includes('RO–East') || actor.includes('Eastern')) return 'Eastern Regional Office';

    const app = applications.find((a) => a.refNo === evt.refId || a.id === evt.refId);
    if (app?.region) return app.region;
    const ut = undertakings.find((u) => u.id === evt.refId || u.refNo === evt.refId);
    if (ut?.region) return ut.region;

    return 'Headquarters (HQ / All Regions)';
  };

  const filteredLog = auditLog.filter((evt) => {
    const matchesSearch =
      evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.refId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.actorName && evt.actorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.note && evt.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.reason && evt.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || evt.actorRole === roleFilter;
    const matchesAction = actionFilter === 'ALL' || evt.action.includes(actionFilter);
    const matchesRefType = refTypeFilter === 'ALL' || evt.refType === refTypeFilter;

    const eventRegion = getEventRegion(evt);
    const matchesRegion =
      regionFilter === 'ALL' ||
      eventRegion.toLowerCase().includes(regionFilter.toLowerCase()) ||
      eventRegion.includes('Headquarters');

    // Date range filtering
    const eventDate = evt.simulatedDate || (evt.timestamp ? evt.timestamp.split('T')[0] : '');
    const matchesFromDate = !fromDate || eventDate >= fromDate;
    const matchesToDate = !toDate || eventDate <= toDate;

    return (
      matchesSearch &&
      matchesRole &&
      matchesAction &&
      matchesRefType &&
      matchesRegion &&
      matchesFromDate &&
      matchesToDate
    );
  });

  // Export as Clean Excel-Compatible CSV
  const handleExportCsv = () => {
    const headers = [
      'Event ID',
      'Simulated Date',
      'Timestamp',
      'Region',
      'Actor Role',
      'Actor Name',
      'Statutory Action',
      'Entity Type',
      'Reference Docket ID',
      'From Stage',
      'To Stage',
      'Audit Memo / Reason'
    ];

    const rows = filteredLog.map((evt) => [
      evt.id,
      evt.simulatedDate || '',
      evt.timestamp || '',
      `"${getEventRegion(evt).replace(/"/g, '""')}"`,
      evt.actorRole,
      `"${(evt.actorName || '').replace(/"/g, '""')}"`,
      evt.action,
      evt.refType || 'APPLICATION',
      evt.refId,
      evt.fromStage || '—',
      evt.toStage || '—',
      `"${(evt.note || evt.reason || '').replace(/"/g, '""')}"`
    ]);

    // UTF-8 BOM (\uFEFF) ensures Excel opens special characters and Indian numerals properly
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.setAttribute('download', `AICTE_APH_Statutory_Audit_Trail_${simulatedDate}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // Download Print-Ready Official PDF Report
  const handleDownloadPdfReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate print-ready PDF certificate.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AICTE Statutory Audit Trail Report - ${simulatedDate}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.4; }
          .header { border-bottom: 2.5px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; }
          .title { font-size: 20px; font-weight: bold; color: #1e3a8a; letter-spacing: -0.5px; }
          .subtitle { font-size: 11px; color: #475569; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: #334155; margin-top: 10px; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 14px; }
          th { background: #1e3a8a; color: white; text-align: left; padding: 7px 8px; font-size: 9px; text-transform: uppercase; font-family: monospace; }
          td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; }
          tr:nth-child(even) { background: #f8fafc; }
          .tag { display: inline-block; padding: 2px 5px; border-radius: 4px; font-weight: bold; font-family: monospace; font-size: 8.5px; }
          .footer { margin-top: 30px; border-top: 1.5px solid #cbd5e1; padding-top: 10px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ALL INDIA COUNCIL FOR TECHNICAL EDUCATION · C.O.M.P.L.I.S.C.A.N.</div>
          <div class="subtitle">Official Statutory Audit Trail & Regulatory Action Registry (APH 2024–2027)</div>
          <div class="meta">
            <span><strong>System Date:</strong> ${simulatedDate}</span>
            <span><strong>Auditor Role:</strong> ${role} (${roleConfig?.title || 'System Auditor'})</span>
            <span><strong>Filtered Records:</strong> ${filteredLog.length} Events</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Date</th>
              <th>Region</th>
              <th>Actor & Authority</th>
              <th>Action Code</th>
              <th>Ref Docket</th>
              <th>Transition</th>
              <th>Audit Memo / Reason</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLog
              .map(
                (evt) => `
              <tr>
                <td style="font-family: monospace; font-weight: bold;">${evt.id}</td>
                <td style="font-family: monospace;">${evt.simulatedDate}</td>
                <td><span style="font-size: 9px; color: #475569;">${getEventRegion(evt)}</span></td>
                <td><strong>${evt.actorName || evt.actorRole}</strong><br><span style="color:#64748b; font-size:8.5px;">${evt.actorRole}</span></td>
                <td><span class="tag" style="background:#e0e7ff; color:#1e3a8a;">${evt.action}</span></td>
                <td style="font-family: monospace;">${evt.refId}<br><span style="color:#64748b; font-size:8.5px;">${evt.refType}</span></td>
                <td style="font-family: monospace;">${evt.fromStage && evt.toStage ? `${evt.fromStage} → ${evt.toStage}` : '—'}</td>
                <td>${evt.note || evt.reason || 'Standard lifecycle movement recorded.'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          <span>CompliScan Legal & Institutional Scrutiny Network • TECH SETU AI</span>
          <span>Cryptographically Verified Log • Print-Ready Statutory Certificate</span>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE F · AUDIT INTEGRITY & STATUTORY TRACEABILITY · TECH SETU AI</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Official System Activity & Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Time-stamped record of every official action, step change, document check, inspection booking,
            and deadline reminder. Provides complete transparency and traceability for every application.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
            title="Download formatted CSV spreadsheet for Microsoft Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Download Excel (.csv)</span>
          </button>

          <button
            onClick={handleDownloadPdfReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs font-bold transition shadow-xs"
            title="Open official print-ready certificate view to save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card rounded-2xl p-4 space-y-3 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Event ID, Ref No, Officer, Note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            >
              <option value="ALL">All Actor Roles</option>
              <option value="REGIONAL_OFFICER">Regional Officer (RO)</option>
              <option value="BUREAU_OFFICER">Bureau Officer (Director)</option>
              <option value="COMMITTEE">Committee (EVC Convener)</option>
              <option value="INSTITUTION">Institution (Registrar)</option>
              <option value="SUPERADMIN">Superadmin (Member Secretary)</option>
              <option value="SYSTEM">System Engine</option>
              <option value="SYSTEM_MONITOR">SLA Sweeper / Automated</option>
            </select>
          </div>

          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            >
              <option value="ALL">All Regional Jurisdictions</option>
              <option value="Western">Western Regional Office</option>
              <option value="Northern">Northern Regional Office</option>
              <option value="North-Western">North-Western Regional Office</option>
              <option value="Southern">Southern Regional Office</option>
              <option value="Central">Central Regional Office</option>
              <option value="Eastern">Eastern Regional Office</option>
            </select>
          </div>

          <div>
            <select
              value={refTypeFilter}
              onChange={(e) => setRefTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            >
              <option value="ALL">All Reference Entities</option>
              <option value="APPLICATION">Applications (APH Dockets)</option>
              <option value="EVC_VISIT">EVC Inspections</option>
              <option value="UNDERTAKING">Compliance Undertakings</option>
              <option value="DOCUMENT">Statutory Documents</option>
              <option value="CONFIG">Configuration Rules</option>
            </select>
          </div>
        </div>

        {/* Date Range and Action Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            >
              <option value="ALL">All Statutory Actions</option>
              <option value="ADVANCED">Stage Advanced</option>
              <option value="REVERTED">Reverted for Deficiency</option>
              <option value="RESUBMITTED">Deficiency Resubmitted</option>
              <option value="SCHEDULED">EVC Scheduled</option>
              <option value="DECISION">Final Decision</option>
              <option value="ESCALATION">Escalation Handled</option>
              <option value="BREACH">SLA Breach Sweeper</option>
              <option value="RENEWAL">Renewal Dispatched</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-500 shrink-0">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-500 shrink-0">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="civic-card rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3a8a] text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Event ID & Date</th>
                <th className="py-3 px-4">Actor & Authority</th>
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Ref Entity & Region</th>
                <th className="py-3 px-4">Stage Transition</th>
                <th className="py-3 px-4">Audit Memo / Notes</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLog.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No official audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLog.map((evt) => {
                  const isRevert = evt.action.includes('REVERT');
                  const isBreach = evt.action.includes('BREACH');
                  const isEscalation = evt.action.includes('ESCALATION');
                  const evtRegion = getEventRegion(evt);

                  return (
                    <tr
                      key={evt.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isRevert
                          ? 'bg-rose-50/20'
                          : isBreach
                          ? 'bg-amber-50/20'
                          : isEscalation
                          ? 'bg-purple-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 block">{evt.id}</span>
                        <span className="text-slate-500 block">{evt.simulatedDate}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{evt.actorName}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">{evt.actorRole}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            isRevert
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isBreach
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isEscalation
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-blue-50 text-[#1e3a8a] border border-blue-200'
                          }`}
                        >
                          {evt.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 block">{evt.refId}</span>
                        <span className="text-slate-500 text-[10px] block">{evt.refType}</span>
                        <span className="text-[9.5px] text-slate-400 font-sans block truncate max-w-[130px]">
                          {evtRegion.replace(' Regional Office', '')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {evt.fromStage && evt.toStage ? (
                          <div className="flex items-center space-x-1 text-slate-700">
                            <span className="font-medium truncate max-w-[80px]">{evt.fromStage}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-bold text-[#1e3a8a] truncate max-w-[80px]">{evt.toStage}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-slate-800 line-clamp-2">
                          {evt.note || evt.reason || 'Standard lifecycle movement recorded.'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Audit Log Cards View (Zero Horizontal Scrolling) */}
        <div className="block lg:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-3">
          {filteredLog.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No audit events found matching your search.
            </div>
          ) : (
            filteredLog.map((evt) => {
              const isRevert = evt.action.includes('REVERT');
              const isBreach = evt.action.includes('BREACH');
              const isEscalation = evt.action.includes('ESCALATION');
              const evtRegion = getEventRegion(evt);

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isRevert
                      ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                      : isBreach
                      ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                      : isEscalation
                      ? 'border-purple-300 bg-purple-50/20 shadow-xs'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#1e3a8a] block">
                        {evt.id}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">{evt.simulatedDate}</span>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-mono text-[9px] font-bold ${
                        isRevert
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isBreach
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isEscalation
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-blue-50 text-[#1e3a8a] border border-blue-200'
                      }`}
                    >
                      {evt.action}
                    </span>
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{evt.actorName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{evt.actorRole}</span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-600">
                      <span>Ref: <strong>{evt.refId}</strong></span>
                      <span>•</span>
                      <span>{evt.refType}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-sans text-[10px]">{evtRegion.replace(' Regional Office', '')}</span>
                    </div>

                    {evt.fromStage && evt.toStage && (
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] pt-1 text-slate-700">
                        <span>{evt.fromStage}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-[#1e3a8a]">{evt.toStage}</span>
                      </div>
                    )}

                    <p className="text-slate-800 font-medium text-xs pt-1 leading-snug">
                      {evt.note || evt.reason || 'Standard lifecycle movement recorded.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="py-1 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 border border-slate-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1e3a8a]" />
                      <span>Inspect Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* INSPECTOR MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Audit Dossier Inspector</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">EVENT IDENTIFIER</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{selectedEvent.id}</p>
                <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                  Simulated Date: {selectedEvent.simulatedDate} · Timestamp: {selectedEvent.timestamp || 'Recorded'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">ACTOR NAME</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedEvent.actorName}</p>
                  <span className="font-mono text-slate-500 text-[10px] block mt-0.5">{selectedEvent.actorRole}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">STATUTORY ACTION</span>
                  <p className="font-mono font-bold text-[#1e3a8a] mt-0.5">{selectedEvent.action}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">REFERENCE ENTITY</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedEvent.refId}</p>
                  <span className="text-slate-500 text-[11px] block">{selectedEvent.refType}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">REGION JURISDICTION</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{getEventRegion(selectedEvent)}</p>
                </div>
              </div>

              {selectedEvent.fromStage && selectedEvent.toStage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-mono text-blue-900 uppercase block font-bold">STAGE TRANSITION</span>
                  <div className="flex items-center space-x-2 font-mono text-xs font-bold text-blue-950 mt-1">
                    <span>{selectedEvent.fromStage}</span>
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span>{selectedEvent.toStage}</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">AUDIT MEMORANDUM / REASON</span>
                <p className="text-slate-800 mt-1 leading-relaxed">
                  {selectedEvent.note || selectedEvent.reason || 'Standard lifecycle movement recorded.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
