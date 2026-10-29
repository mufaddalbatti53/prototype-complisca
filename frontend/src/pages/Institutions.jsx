import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Clock,
  Eye,
  X,
  ExternalLink,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function Institutions() {
  const { institutions, applications, undertakings, documents } = useAicte();
  const { role } = useRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Institution Dossier Drawer
  const [selectedInst, setSelectedInst] = useState(null);

  // Institution & Regional Officer Role Scoping
  const isInstitutionRole = role === 'INSTITUTION';
  const isRegionalOfficer = role === 'REGIONAL_OFFICER';

  const accessibleInsts = isInstitutionRole
    ? institutions.filter(
        (inst) =>
          inst.id === 'inst_sunrise' ||
          inst.name?.toLowerCase().includes('sunrise')
      )
    : isRegionalOfficer
    ? institutions.filter(
        (inst) =>
          inst.region?.toLowerCase().includes('west') ||
          inst.name?.toLowerCase().includes('sunrise') ||
          inst.name?.toLowerCase().includes('deccan')
      )
    : institutions;

  // Filtered institutions
  const filteredInsts = accessibleInsts.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.aisheCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.state.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = regionFilter === 'ALL' || inst.region === regionFilter;
    const matchesRisk = riskFilter === 'ALL' || inst.riskFlag === riskFilter;
    const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;

    return matchesSearch && matchesRegion && matchesRisk && matchesStatus;
  });

  const totalInsts = accessibleInsts.length;
  const activeCount = accessibleInsts.filter((i) => i.status === 'ACTIVE').length;
  const reviewCount = accessibleInsts.filter((i) => i.status === 'UNDER_REVIEW').length;
  const suspendedCount = accessibleInsts.filter((i) => i.status === 'SUSPENDED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE G · JURISDICTIONAL REGISTRY & INSTITUTIONAL DOSSIERS</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Colleges & Institutions Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Centralized directory of technical and higher educational institutions across all 8 AICTE Regional Offices.
            Tracks AISHE codes, active approval applications, compliance rating scores, and risk flags.
          </p>
        </div>
      </div>

      {/* College Portal Banner (Shown ONLY for Institution role) */}
      {isInstitutionRole && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                College Profile: Sunrise Institute of Technology
              </span>
              <span className="text-slate-700">
                AISHE Code: <strong>C-41208</strong> · Western Regional Office (Pune, Maharashtra). Viewing your institution's profile and active statutory record.
              </span>
            </div>
          </div>
          <span className="shrink-0 font-mono text-[11px] font-bold px-3 py-1 rounded-md bg-amber-200/80 text-amber-950 border border-amber-400">
            College Registrar Account
          </span>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="civic-card p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            REGISTERED COLLEGES
          </span>
          <span className="text-2xl font-serif font-bold text-slate-900 mt-1 block">{totalInsts}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{isInstitutionRole ? 'Your institution' : '8 Regional Offices'}</span>
        </div>

        <div className="civic-card p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
            ACTIVE & APPROVED
          </span>
          <span className="text-2xl font-serif font-bold text-emerald-600 mt-1 block">{activeCount}</span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Full approvals</span>
        </div>

        <div className="civic-card p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/20">
          <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider block">
            UNDER REVIEW
          </span>
          <span className="text-2xl font-serif font-bold text-amber-600 mt-1 block">{reviewCount}</span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Active review or visit</span>
        </div>

        <div className="civic-card p-4 rounded-2xl bg-white border border-rose-200 bg-rose-50/30">
          <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider block">
            SUSPENDED / ON HOLD
          </span>
          <span className="text-2xl font-serif font-bold text-rose-600 mt-1 block">{suspendedCount}</span>
          <span className="text-[11px] text-rose-700 mt-0.5 block">Notice active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, AISHE Code, City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          />
        </div>

        {!isRegionalOfficer && !isInstitutionRole ? (
          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            >
              <option value="ALL">All Regional Offices (8)</option>
              <option value="Western Regional Office">Western (Mumbai/Pune)</option>
              <option value="Northern Regional Office">Northern (Delhi/UP)</option>
              <option value="Southern Regional Office">Southern (Chennai)</option>
              <option value="South-Western Regional Office">South-Western (Bengaluru/Kerala)</option>
              <option value="South-Central Regional Office">South-Central (Hyderabad)</option>
              <option value="Eastern Regional Office">Eastern (Kolkata/Assam)</option>
              <option value="Central Regional Office">Central (Bhopal)</option>
              <option value="North-Western Regional Office">North-Western (Chandigarh/Punjab)</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#1e3a8a] mr-1.5 shrink-0" />
            <span className="truncate">Jurisdiction: {isInstitutionRole ? 'Western (Sunrise Inst)' : 'Western Regional Office'}</span>
          </div>
        )}

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Risk Ratings</option>
            <option value="LOW">Low Risk (Score &gt;85)</option>
            <option value="MEDIUM">Medium Risk (Score 75–85)</option>
            <option value="HIGH">High Risk (Score &lt;75)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Approval Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="civic-card rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3a8a] text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">AISHE Code & Institution</th>
                <th className="py-3 px-4">Regional Office & State</th>
                <th className="py-3 px-4">Discipline / Type</th>
                <th className="py-3 px-4">Intake Capacity</th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 group relative cursor-help">
                    <span>Compliance Score</span>
                    <span className="text-[10px] bg-white/20 px-1 rounded font-normal text-amber-200">ℹ</span>
                    <div className="hidden group-hover:block absolute top-full left-0 z-30 mt-1 w-64 p-2.5 bg-slate-900 text-white text-[11px] font-sans normal-case rounded-xl shadow-xl border border-slate-700 space-y-1">
                      <span className="font-bold text-amber-300 block">Compliance Score Weightage:</span>
                      <p>• <strong>40% Approvals:</strong> Procedural stage fidelity & zero unrectified deficiencies</p>
                      <p>• <strong>30% Documents:</strong> Active land lease, structural PWD, and Fire NOC validity</p>
                      <p>• <strong>30% Undertakings:</strong> Time-bound conditions discharged within 90 days</p>
                    </div>
                  </div>
                </th>
                <th className="py-3 px-4">Risk Rating</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredInsts.map((inst) => {
                const isHighRisk = inst.riskFlag === 'HIGH';
                const isMedRisk = inst.riskFlag === 'MEDIUM';

                return (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <Building2 className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">{inst.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">AISHE: {inst.aisheCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-medium block">{inst.region.replace(' Regional Office', '')}</span>
                      <span className="text-[11px] text-slate-500">{inst.district}, {inst.state}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {inst.type}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inst.intakeCapacity} Seats
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2 cursor-help" title="Score breakdown: 40% Approvals + 30% Documents + 30% Undertakings">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                inst.complianceScore >= 90
                                  ? 'bg-emerald-500'
                                  : inst.complianceScore >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${inst.complianceScore}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-900">
                            {inst.complianceScore}%
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-500 block">40% App · 30% Doc · 30% UT</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isHighRisk
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isMedRisk
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {inst.riskFlag} RISK
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          inst.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : inst.status === 'UNDER_REVIEW'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {inst.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Institutions Cards View (Zero Horizontal Scrolling) */}
        <div className="block lg:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-3">
          {filteredInsts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No institutions found matching your search.
            </div>
          ) : (
            filteredInsts.map((inst) => {
              const isHighRisk = inst.riskFlag === 'HIGH';
              const isMedRisk = inst.riskFlag === 'MEDIUM';

              return (
                <div
                  key={inst.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block leading-tight">{inst.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">AISHE: {inst.aisheCode}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold shrink-0 ${
                        inst.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inst.status === 'UNDER_REVIEW'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {inst.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-slate-600">
                      {inst.district}, {inst.state} · <span className="font-medium text-slate-800">{inst.region.replace(' Regional Office', '')}</span>
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-mono text-slate-600">{inst.type}</span>
                      <span className="font-mono font-bold text-slate-800">{inst.intakeCapacity} Seats</span>
                    </div>
                  </div>

                  {/* Compliance Score Bar & Explanation */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              inst.complianceScore >= 90
                                ? 'bg-emerald-500'
                                : inst.complianceScore >= 75
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${inst.complianceScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-900">
                          {inst.complianceScore}%
                        </span>
                      </div>
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                          isHighRisk
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isMedRisk
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {inst.riskFlag} RISK
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      Formula: 40% Approvals · 30% Documents · 30% Undertakings
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedInst(inst)}
                      className="font-bold text-xs inline-flex items-center space-x-1 bg-[#1e3a8a] text-white hover:bg-[#172554] px-3 py-1.5 rounded-xl transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Dossier</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* INSTITUTION DOSSIER DRAWER / MODAL */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#1e3a8a] text-white rounded-xl">
                  <Building2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">{selectedInst.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    AISHE Code: {selectedInst.aisheCode} · Est. {selectedInst.establishedYear}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedInst(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">JURISDICTION</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedInst.region.replace(' Regional Office', '')}</p>
                <span className="text-[11px] text-slate-500 block">{selectedInst.district}, {selectedInst.state}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">INTAKE CAPACITY</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedInst.intakeCapacity} Seats</p>
                <span className="text-[11px] text-slate-500 block">{selectedInst.type}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">COMPLIANCE SCORE</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedInst.complianceScore} / 100</p>
                <span className="text-[10px] text-slate-500 block">{selectedInst.riskFlag} Risk · 40% App, 30% Doc, 30% UT</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">APPROVAL STATUS</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedInst.status}
                </span>
              </div>
            </div>

            {/* Active Applications for this Institution */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Active Approval Applications & Dockets</span>
              {applications.filter((a) => a.institutionName === selectedInst.name).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  No active approval applications currently in progress.
                </p>
              ) : (
                applications
                  .filter((a) => a.institutionName === selectedInst.name)
                  .map((app) => (
                    <div key={app.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold font-mono text-slate-900 block">{app.refNo}</span>
                        <span className="text-[11px] text-slate-600 block">{app.courseDetails}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          Route: {app.route} · Dwell: {app.daysInStage}d
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-[#1e3a8a] text-white">
                        {app.currentStage}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Documents registered for this institution */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Registered Statutory Documents & NOCs</span>
              {documents.filter((d) => d.institutionName === selectedInst.name).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  No documents registered for this institution.
                </p>
              ) : (
                documents
                  .filter((d) => d.institutionName === selectedInst.name)
                  .map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{doc.docType}</span>
                        <span className="text-[11px] text-slate-500 font-mono">Expires: {doc.expiryDate}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        doc.status === 'EXPIRED' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Undertakings for this institution */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Time-Bound Undertakings Imposed</span>
              {undertakings.filter((u) => u.institutionName === selectedInst.name).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  Zero pending undertakings. Clean compliance record.
                </p>
              ) : (
                undertakings
                  .filter((u) => u.institutionName === selectedInst.name)
                  .map((ut) => (
                    <div key={ut.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{ut.id} ({ut.refNo})</span>
                        <span className="text-[11px] text-slate-600 block line-clamp-1">{ut.conditionText}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Due: {ut.dueDate}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-900">
                        L{ut.escalationLevel} · {ut.status}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedInst(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-xl transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
