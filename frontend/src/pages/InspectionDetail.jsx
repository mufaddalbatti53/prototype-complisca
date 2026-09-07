import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileDown, FileJson, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import InspectionCanvas from '../components/InspectionCanvas';
import DeclarationTable from '../components/DeclarationTable';
import FontAnalysisCard from '../components/FontAnalysisCard';
import ViolationSummary from '../components/ViolationSummary';

export default function InspectionDetail({ inspectionId, onBack }) {
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDecl, setSelectedDecl] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await api.getInspectionDetail(inspectionId);
        setInspection(data);
        if (data?.declarations?.length > 0) {
          setSelectedDecl(data.declarations[0]);
        }
      } catch (err) {
        console.error('Failed to fetch inspection detail', err);
      } finally {
        setLoading(false);
      }
    };
    if (inspectionId) {
      fetchDetail();
    }
  }, [inspectionId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 text-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-semibold">Loading statutory audit evidence record...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 glass-panel rounded-2xl">
        <p className="text-base font-bold text-white">Inspection record not found.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 hover:underline text-xs font-bold">
          Return to Audit History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-cyan-500/25 shadow-card-dark">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-gov-900 hover:bg-gov-800 border border-white/10 text-slate-300 hover:text-white transition shadow"
            title="Back to History"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                Ref: {inspection.notice_number || inspection.id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(inspection.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {inspection.product_name} <span className="text-cyan-400 font-normal text-lg">({inspection.brand})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={api.getPdfReportUrl(inspection.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-glow-red transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Form 1 Notice</span>
          </a>
          <a
            href={api.getJsonReportUrl(inspection.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-gov-800 hover:bg-gov-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-white/10 flex items-center space-x-1.5 transition shadow"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left Canvas + Right Audit Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-[720px]">
          <InspectionCanvas
            inspection={inspection}
            selectedDecl={selectedDecl}
            onSelectDecl={setSelectedDecl}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <ViolationSummary inspection={inspection} />
          <DeclarationTable
            declarations={inspection.declarations}
            selectedDecl={selectedDecl}
            onSelectDecl={setSelectedDecl}
          />
          <FontAnalysisCard
            pdpArea={inspection.pdp_area_sqcm}
            declarations={inspection.declarations}
          />
        </div>
      </div>
    </div>
  );
}
