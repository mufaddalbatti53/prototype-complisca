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
  History
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function AuditTrail() {
  const { auditLog, simulatedDate } = useAicte();
  const { role } = useRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [refTypeFilter, setRefTypeFilter] = useState('ALL');

  // Selected audit entry for inspector modal
  const [selectedEvent, setSelectedEvent] = useState(null);

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

    return matchesSearch && matchesRole && matchesAction && matchesRefType;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `compliscan_audit_log_${simulatedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE F · AUDIT INTEGRITY & STATUTORY TRACEABILITY</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Official System Activity & Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Time-stamped record of every official action, step change, document check, inspection booking,
            and deadline reminder. Provides complete transparency and traceability for every application.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Download Audit Log (JSON)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
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
          </select>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="civic-card rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3a8a] text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Event ID & Date</th>
                <th className="py-3 px-4">Actor & Authority</th>
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Ref Entity</th>
                <th className="py-3 px-4">Stage Transition</th>
                <th className="py-3 px-4">Audit Memo / Notes</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLog.map((evt) => {
                const isRevert = evt.action.includes('REVERT');
                const isBreach = evt.action.includes('BREACH');
                const isEscalation = evt.action.includes('ESCALATION');

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
                      <p className="text-slate-800 line-clamp-2">{evt.note || evt.reason || 'Standard lifecycle movement recorded.'}</p>
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVENT INSPECTOR MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Audit Event Inspector</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">EVENT ID</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedEvent.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">TIMESTAMP</span>
                  <p className="font-mono text-slate-700">{selectedEvent.timestamp}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">ACTOR NAME</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedEvent.actorName}</p>
                  <span className="text-[10px] font-mono text-slate-500 block">{selectedEvent.actorRole}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">ACTION CODE</span>
                  <p className="font-mono font-bold text-[#1e3a8a] mt-0.5">{selectedEvent.action}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">REFERENCE ENTITY</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">
                  {selectedEvent.refId} ({selectedEvent.refType})
                </p>
              </div>

              {selectedEvent.fromStage && selectedEvent.toStage && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">STAGE TRANSITION</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedEvent.fromStage} → {selectedEvent.toStage}
                  </p>
                </div>
              )}

              {selectedEvent.reason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] font-mono text-rose-800 uppercase block font-bold">STATUTORY REASON</span>
                  <p className="text-rose-950 mt-0.5">{selectedEvent.reason}</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">AUDIT NOTE / OBSERVATION</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed">{selectedEvent.note || 'None recorded'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-xl transition shadow-xs"
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
