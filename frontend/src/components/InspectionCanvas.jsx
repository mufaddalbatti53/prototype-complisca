import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { STORAGE_BASE } from '../services/api';

export default function InspectionCanvas({ inspection, selectedDecl, onSelectDecl, previewUrl }) {
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState('annotated'); // annotated, preprocessed, original
  const [showBoxes, setShowBoxes] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [imgLoadFailed, setImgLoadFailed] = useState(false);
  const [resetPulse, setResetPulse] = useState(false);

  const imgData = inspection?.images?.[0] || {};

  // Sample static fallback in case Render ephemeral filesystem wipes container uploads
  const sampleFallback = (() => {
    const pName = `${inspection?.product_name || ''} ${inspection?.brand || ''}`.toLowerCase();
    if (pName.includes('mad angles') || pName.includes('bingo')) {
      return '/samples/demo_bingo_mad_angles.jpg';
    }
    if (pName.includes('milkybar') || pName.includes('nestle')) {
      return '/samples/demo_nestle_milkybar.jpg';
    }
    return '';
  })();

  const rawOriginalUrl = previewUrl || (imgData.original_url ? `${STORAGE_BASE}${imgData.original_url}` : sampleFallback);

  let currentImgUrl = '';
  if (imgLoadFailed) {
    currentImgUrl = rawOriginalUrl || sampleFallback;
  } else if (activeTab === 'annotated') {
    currentImgUrl = imgData.annotated_url
      ? `${STORAGE_BASE}${imgData.annotated_url}`
      : rawOriginalUrl;
  } else if (activeTab === 'preprocessed') {
    currentImgUrl = imgData.preprocessed_url
      ? `${STORAGE_BASE}${imgData.preprocessed_url}`
      : rawOriginalUrl;
  } else {
    // Raw original label: prefer direct client upload blob/file if present
    currentImgUrl = rawOriginalUrl;
  }

  const handleResetCanvas = () => {
    setZoom(1);
    setActiveTab('annotated');
    setFilterStatus('ALL');
    setShowBoxes(true);
    setImgLoadFailed(false);
    if (onSelectDecl) onSelectDecl(null);
    setResetPulse(true);
    setTimeout(() => setResetPulse(false), 600);
  };

  const declarations = (inspection?.declarations || []).filter((d) => {
    if (filterStatus === 'ALL') return true;
    return d.compliance_status === filterStatus;
  });

  const getStatusBorder = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return 'border-emerald-500 bg-emerald-500/20 text-emerald-800';
      case 'WARNING':
        return 'border-amber-500 bg-amber-500/20 text-amber-800';
      case 'VIOLATION':
      default:
        return 'border-rose-500 bg-rose-500/20 text-rose-800';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 shadow-xs bg-white overflow-hidden flex flex-col h-full">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Layer:</span>
          <div className="flex bg-slate-200/70 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('annotated')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'annotated'
                  ? 'bg-white text-sky-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inspection Overlay
            </button>
            <button
              onClick={() => setActiveTab('preprocessed')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'preprocessed'
                  ? 'bg-white text-sky-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pre-processed (OpenCV)
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'original'
                  ? 'bg-white text-sky-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Label
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-800 border border-slate-300 shadow-xs font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('VIOLATION')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center space-x-1 transition ${
              filterStatus === 'VIOLATION'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                : 'text-rose-600 hover:bg-rose-50/50'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Violations</span>
          </button>
          <button
            onClick={() => setFilterStatus('WARNING')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center space-x-1 transition ${
              filterStatus === 'WARNING'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold'
                : 'text-amber-700 hover:bg-amber-50/50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Warnings</span>
          </button>
          <button
            onClick={() => setFilterStatus('COMPLIANT')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center space-x-1 transition ${
              filterStatus === 'COMPLIANT'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                : 'text-emerald-600 hover:bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Compliant</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-700 w-10 text-center font-mono font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCanvas}
            className={`p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition ml-1 flex items-center justify-center ${
              resetPulse ? 'ring-2 ring-sky-400 text-sky-600 scale-105' : ''
            }`}
            title="Reset Canvas View, Filters & Zoom (100%)"
          >
            <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${resetPulse ? 'rotate-180 text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Packaging Viewport */}
      <div className="relative flex-1 bg-slate-100/70 flex items-center justify-center overflow-auto p-4 min-h-[480px]">
        {currentImgUrl ? (
          <div
            className="relative transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img
              key={`${currentImgUrl}-${activeTab}`}
              src={currentImgUrl}
              alt="Packaged Commodity"
              onError={() => {
                if (!imgLoadFailed && (rawOriginalUrl || sampleFallback)) {
                  setImgLoadFailed(true);
                }
              }}
              className="max-h-[620px] w-auto object-contain rounded-xl border border-slate-200 shadow-lg"
            />

            {/* Interactive Bounding Boxes Overlay */}
            {activeTab !== 'annotated' && showBoxes && (
              <div className="absolute inset-0 pointer-events-none">
                {declarations.map((decl, idx) => {
                  const bbox = decl.bounding_box;
                  if (!bbox || bbox.length < 4) return null;
                  const [ymin, xmin, ymax, xmax] = bbox;
                  const top = `${ymin / 10}%`;
                  const left = `${xmin / 10}%`;
                  const height = `${(ymax - ymin) / 10}%`;
                  const width = `${(xmax - xmin) / 10}%`;

                  const isSelected = selectedDecl?.field_code === decl.field_code;

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectDecl && onSelectDecl(decl)}
                      className={`absolute pointer-events-auto cursor-pointer border-2 transition-all duration-150 ${getStatusBorder(
                        decl.compliance_status
                      )} ${isSelected ? 'ring-4 ring-sky-500 z-30 scale-[1.01]' : 'hover:ring-2 hover:ring-slate-900 z-20'}`}
                      style={{ top, left, width, height }}
                    >
                      <span className="absolute -top-5 left-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/95 border border-current whitespace-nowrap shadow-xs">
                        {decl.statutory_rule_ref}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-16">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No packaging image available for this inspection</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>Principal Display Panel Area: <b className="text-slate-800 font-mono">{inspection?.pdp_area_sqcm || 100} cm²</b></span>
        <span className="text-sky-700 font-mono font-bold">Notice No: {inspection?.notice_number || 'N/A'}</span>
      </div>
    </div>
  );
}
