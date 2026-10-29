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
import { subscribeSync, broadcastSync } from '../services/sync';

export default function Parties() {
  const { role } = useRole();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('Retailer');
  const [gstin, setGstin] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [district, setDistrict] = useState('North West Delhi');
  const [state, setState] = useState('Delhi');

  const loadParties = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getParties(params);
      setParties(data);
    } catch (err) {
      console.error('Failed to load parties', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadParties(true);
  }, [statusFilter]);

  useEffect(() => {
    const unsubscribe = subscribeSync(() => {
      loadParties(false);
    });
    return unsubscribe;
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadParties(true);
  };

  const handleStatusChange = async (partyId, newStatus) => {
    try {
      await api.updatePartyStatus(partyId, newStatus);
      setParties((prev) =>
        prev.map((p) => (p.id === partyId ? { ...p, status: newStatus } : p))
      );
      broadcastSync('PARTY_STATUS_UPDATED', { partyId, newStatus });
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
      loadParties(false);
      broadcastSync('PARTY_CREATED');
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            APPROVED
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            SUSPENDED
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            REVOKED
          </span>
        );
      case 'PENDING_REVIEW':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            PENDING REVIEW
          </span>
        );
    }
  };

  const getRiskBadge = (rating) => {
    switch (rating) {
      case 'CRITICAL':
        return <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-mono font-bold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">LOW RISK</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 mb-2">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-brand-700">
              Enterprise Regulated Parties Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inspected Entities & Trade Directory
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            State Legal Metrology Authority registry of manufacturers, packers, importers, and retail chains. Control trading licenses, suspend repeat offenders, and review statutory delinquency.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadParties}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition"
            title="Reload Entities"
          >
            <RefreshCw className={`w-4 h-4 text-brand-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {role === 'SUPERADMIN' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Entity</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Trade Name, GSTIN, or License Number..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-bold mr-1">Status:</span>
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
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm font-medium">
            Loading regulated trade entities...
          </div>
        ) : parties.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <p className="text-base font-bold text-slate-800">No trade entities found.</p>
            <p className="text-xs text-slate-500 mt-1">Try modifying your filter query or add a new entity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="mt-1">{getRiskBadge(p.risk_rating)}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {p.entity_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] space-y-1">
                      <div className="text-slate-700">GSTIN: {p.gstin || 'N/A'}</div>
                      <div className="text-slate-500">Lic: {p.trade_license || 'Unassigned'}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="text-slate-700 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-brand-600 flex-shrink-0" />
                        <span>{p.district}, {p.state}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <div className="text-slate-700">Inspections: <b>{p.total_inspections}</b></div>
                      <div className={p.total_violations > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                        Violations: {p.total_violations}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="p-4 text-right">
                      {role === 'SUPERADMIN' ? (
                        <div className="inline-flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          {p.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'SUSPENDED')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition shadow-sm"
                            >
                              Suspend
                            </button>
                          )}
                          {p.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleStatusChange(p.id, 'REVOKED')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition shadow-sm"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">View Only</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <span>Register Commercial Entity</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Legal Trade Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Cash & Carry Pvt Ltd"
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Entity Category
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option>Retailer</option>
                    <option>Manufacturer</option>
                    <option>Packer</option>
                    <option>Importer</option>
                    <option>E-Commerce Marketplace</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Trade License Ref
                  </label>
                  <input
                    type="text"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    placeholder="TL-MCD-2026-..."
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
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
