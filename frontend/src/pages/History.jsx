import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileDown, Trash2, Calendar, Store, MapPin, Eye, ExternalLink } from 'lucide-react';
import { api, STORAGE_BASE } from '../services/api';
import { subscribeSync, broadcastSync } from '../services/sync';

export default function History({ onSelectInspection }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');

  const loadInspections = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (verdictFilter) params.verdict = verdictFilter;

      const data = await api.getInspections(params);
      setInspections(data);
    } catch (err) {
      console.error('Failed to load inspections', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [searchTerm, verdictFilter]);

  useEffect(() => {
    loadInspections(true);
  }, [loadInspections]);

  // Real-time synchronization across all browser tabs and focus events
  useEffect(() => {
    const unsubscribe = subscribeSync((event) => {
      // Refresh without destroying view when another tab creates/modifies an inspection or on tab focus
      loadInspections(false);
    });
    return unsubscribe;
  }, [loadInspections]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInspections(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inspection record and legal notice?')) {
      try {
        await api.deleteInspection(id);
        setInspections((prev) => prev.filter((item) => item.id !== id));
        broadcastSync('INSPECTION_DELETED', { id });
      } catch (err) {
        alert('Failed to delete inspection record');
      }
    }
  };

  const handlePurgeAll = async () => {
    if (window.confirm('Are you sure you want to clear all previous product reports and scan data? Statutory rules, registered entities, and demo images will remain intact.')) {
      try {
        await api.purgeAllInspections();
        setInspections([]);
        broadcastSync('INSPECTION_DELETED');
      } catch (err) {
        alert('Failed to clear previous inspections.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Inspection History & Evidence Repository
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Archived statutory records, digital evidence lockers, and issued Form 1 non-compliance notices under LMPC Rules 2011.
          </p>
        </div>

        {inspections.length > 0 && (
          <button
            onClick={handlePurgeAll}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
            title="Purge all previous product scans & generated reports"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Reports</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Product Name, Brand, Retailer, or Notice Ref..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        {/* Verdict Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-bold mr-1">Status:</span>
          {[
            { label: 'All Records', val: '' },
            { label: 'Non-Compliant', val: 'NON_COMPLIANT' },
            { label: 'Warnings', val: 'WARNING' },
            { label: 'Compliant', val: 'COMPLIANT' },
          ].map((v) => (
            <button
              key={v.val}
              onClick={() => setVerdictFilter(v.val)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                verdictFilter === v.val
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm font-medium">
          Loading statutory repository records...
        </div>
      ) : inspections.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-slate-500 border border-slate-200 shadow-sm">
          <p className="text-base font-bold text-slate-800">No matching inspection records found.</p>
          <p className="text-xs text-slate-500 mt-1">Try refining your search query or run a new inspection scan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspections.map((item) => {
            const thumb = item.images?.[0]?.preprocessed_url || item.images?.[0]?.original_url;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition duration-150"
              >
                {/* Packaging Header */}
                <div className="relative h-48 bg-slate-100 flex items-center justify-center p-3 border-b border-slate-200">
                  {thumb ? (
                    <img
                      src={`${STORAGE_BASE}${thumb}`}
                      alt={item.product_name}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No Image Evidence</span>
                  )}

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border shadow-sm ${
                        item.compliance_verdict === 'COMPLIANT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.compliance_verdict === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {item.compliance_verdict}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-mono font-bold text-slate-800 shadow-sm">
                    Score: {item.overall_compliance_score}%
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                      {item.product_name}
                    </h3>
                    <span className="text-xs text-brand-600 block font-semibold">{item.brand}</span>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                        <Store className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.store_name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectInspection && onSelectInspection(item.id)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center space-x-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect Audit</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <a
                        href={api.getPdfReportUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition shadow-sm"
                        title="Download Statutory Notice PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
