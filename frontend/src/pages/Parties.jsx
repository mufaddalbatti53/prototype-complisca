import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useRole } from '../context/RoleContext';

export default function Parties() {
  const { role } = useRole();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Party Form
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('Retailer');
  const [gstin, setGstin] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [district, setDistrict] = useState('North West Delhi');
  const [state, setState] = useState('Delhi');

  const loadParties = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getParties(params);
      setParties(data);
    } catch (err) {
      console.error('Failed to load parties', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadParties();
  };

  const handleStatusChange = async (partyId, newStatus) => {
    try {
      await api.updatePartyStatus(partyId, newStatus);
      setParties((prev) =>
        prev.map((p) => (p.id === partyId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      alert('Failed to update entity status.');
    }
  };

  const handleCreateParty = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.createParty({
        name,
        entity_type: entityType,
        gstin,
        trade_license: tradeLicense,
        district,
        state,
        status: 'APPROVED',
        risk_rating: 'LOW'
      });
      setShowAddModal(false);
      setName('');
      setGstin('');
      setTradeLicense('');
      loadParties();
    } catch (err) {
      alert('Failed to register new party entity.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            APPROVED
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            SUSPENDED
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            REVOKED
          </span>
        );
      case 'PENDING_REVIEW':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3 h-3 mr-1" />
            PENDING REVIEW
          </span>
        );
    }
  };

  const getRiskBadge = (rating) => {
    switch (rating) {
      case 'CRITICAL':
        return <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/40">CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-mono font-bold text-yellow-300 bg-yellow-950 px-2 py-0.5 rounded border border-yellow-500/40">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">LOW RISK</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-2">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300">
              Enterprise Regulated Parties Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Inspected Entities & Trade Directory
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            State Legal Metrology Authority registry of manufacturers, packers, importers, and retail chains. Control trading licenses, suspend repeat offenders, and review statutory delinquency.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadParties}
            className="p-2.5 rounded-xl bg-gov-800 hover:bg-gov-700 text-slate-300 border border-white/10 transition"
            title="Reload Entities"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {role === 'SUPERADMIN' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-glow-cyan transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Entity</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between shadow-card-dark">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Trade Name, GSTIN, or License Number..."
            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-bold mr-1">Status:</span>
          {[
            { label: 'All Entities', val: '' },
            { label: 'Approved', val: 'APPROVED' },
            { label: 'Suspended', val: 'SUSPENDED' },
            { label: 'Revoked', val: 'REVOKED' },
          ].map((st) => (
            <button
              key={st.val}
              onClick={() => setStatusFilter(st.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st.val
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'bg-gov-950/80 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parties Table */}
      <div className="glass-panel rounded-2xl border border-white/[0.08] shadow-card-dark overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            Loading regulated trade entities...
          </div>
        ) : parties.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <p className="text-base font-bold text-white">No trade entities found.</p>
            <p className="text-xs text-slate-500 mt-1">Try modifying your filter query or add a new entity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gov-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="p-4">Regulated Business Entity</th>
                  <th className="p-4">Entity Category</th>
                  <th className="p-4">Statutory Identifiers</th>
                  <th className="p-4">Jurisdiction</th>
                  <th className="p-4">Audit History</th>
                  <th className="p-4">Licensing Status</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-200">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="mt-1">{getRiskBadge(p.risk_rating)}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-slate-300 bg-gov-900 px-2.5 py-1 rounded-lg border border-white/10">
                        {p.entity_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] space-y-1">
                      <div className="text-slate-300">GSTIN: {p.gstin || 'N/A'}</div>
                      <div className="text-slate-400">Lic: {p.trade_license || 'Unassigned'}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="text-slate-300 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span>{p.district}, {p.state}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <div className="text-slate-300">Inspections: <b>{p.total_inspections}</b></div>
                      <div className={p.total_violations > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                        Violations: {p.total_violations}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="p-4 text-right">
                      {role === 'SUPERADMIN' ? (
                        <div className="inline-flex items-center space-x-1 bg-gov-950 p-1 rounded-xl border border-white/10">
                          {p.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition"
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'SUSPENDED')}
                              className="px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition"
                            >
                              Suspend
                            </button>
                          )}
                          {p.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'REVOKED')}
                              className="px-2.5 py-1 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/40 text-[10px] font-bold transition"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gov-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>Register Commercial Entity</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Legal Trade Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Cash & Carry Pvt Ltd"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Entity Category
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option className="bg-gov-950">Retailer</option>
                    <option className="bg-gov-950">Manufacturer</option>
                    <option className="bg-gov-950">Packer</option>
                    <option className="bg-gov-950">Importer</option>
                    <option className="bg-gov-950">E-Commerce Marketplace</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Trade License Ref
                  </label>
                  <input
                    type="text"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    placeholder="TL-MCD-2026-..."
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow-cyan transition"
                >
                  {submitting ? 'Registering...' : 'Register Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
