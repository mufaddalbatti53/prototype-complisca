import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  Sliders,
  Store,
  MapPin,
  FileCheck2,
  Play,
  RotateCcw
} from 'lucide-react';
import { api, STORAGE_BASE } from '../services/api';
import InspectionCanvas from '../components/InspectionCanvas';
import DeclarationTable from '../components/DeclarationTable';
import FontAnalysisCard from '../components/FontAnalysisCard';
import ViolationSummary from '../components/ViolationSummary';
import CameraModal from '../components/CameraModal';

export default function Scanner() {
  const [mode, setMode] = useState('upload'); // upload, camera, url
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  // Parameters
  const [pdpArea, setPdpArea] = useState(150.0);
  const [pdpShape, setPdpShape] = useState('RECTANGULAR');
  const [category, setCategory] = useState('Packaged Food & Beverage');
  const [storeName, setStoreName] = useState('Metro Cash & Carry, Rohini');
  const [location, setLocation] = useState('New Delhi, India');
  const [inspectorName, setInspectorName] = useState('Enforcement Officer R. Sharma');

  // Execution states
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [selectedDecl, setSelectedDecl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setErrorMsg(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      setErrorMsg(null);
    }
  };

  const handleCameraCapture = (capturedFile) => {
    setFile(capturedFile);
    setPreviewUrl(URL.createObjectURL(capturedFile));
    setErrorMsg(null);
  };

  // 1-Click Sample Preloader
  const loadSamplePreset = async (sampleType) => {
    setErrorMsg(null);
    try {
      const filename = sampleType === 'non_compliant' ? 'sample_wheat_biscuits.jpg' : 'sample_mustard_oil.jpg';
      const sampleUrl = `${STORAGE_BASE}/storage/samples/${filename}`;
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const loadedFile = new File([blob], filename, { type: 'image/jpeg' });
      setFile(loadedFile);
      setPreviewUrl(URL.createObjectURL(loadedFile));
      setMode('upload');

      if (sampleType === 'non_compliant') {
        setPdpArea(150.0);
        setPdpShape('RECTANGULAR');
        setCategory('Packaged Food & Beverage');
        setStoreName('Metro Superstore, Rohini');
        setLocation('New Delhi, India');
      } else {
        setPdpArea(180.0);
        setPdpShape('CYLINDRICAL');
        setCategory('Packaged Food & Beverage');
        setStoreName('Reliance Smart Bazaar');
        setLocation('Ghaziabad, UP');
      }
    } catch (err) {
      setErrorMsg('Failed to load sample image. Please upload a file.');
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    setPipelineStep(1);

    try {
      let result = null;

      if (mode === 'url') {
        if (!urlInput.trim()) {
          throw new Error('Please enter a valid product listing URL.');
        }
        setPipelineStep(2);
        result = await api.scanUrl({
          url: urlInput.trim(),
          category,
          store_name: storeName,
          location,
          pdp_area_sqcm: parseFloat(pdpArea) || 120.0
        });
      } else {
        if (!file) {
          throw new Error('Please upload or snap a packaging label photo.');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('store_name', storeName);
        formData.append('location', location);
        formData.append('inspector_name', inspectorName);
        formData.append('pdp_area_sqcm', pdpArea.toString());
        formData.append('pdp_shape', pdpShape);

        setTimeout(() => setPipelineStep(2), 800);  // OpenCV Preprocessing
        setTimeout(() => setPipelineStep(3), 2000); // OCR & Dimensions
        setTimeout(() => setPipelineStep(4), 3500); // Rule + Gemini Flash
        setTimeout(() => setPipelineStep(5), 5200); // Form 1 Notice Generation

        result = await api.uploadAndScan(formData);
      }

      setInspectionResult(result);
      if (result?.declarations?.length > 0) {
        setSelectedDecl(result.declarations[0]);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Inspection failed.');
    } finally {
      setLoading(false);
      setPipelineStep(0);
    }
  };

  const resetScanner = () => {
    setInspectionResult(null);
    setFile(null);
    setPreviewUrl('');
    setUrlInput('');
    setSelectedDecl(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300">
              Tech Setu • Automated Inspection Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Packaged Commodity Compliance Scanner
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
            Instant statutory verification under the <b>Legal Metrology (Packaged Commodities) Rules, 2011</b>. Automated extraction of mandatory declarations, Principal Display Panel (PDP) font size ratio measurement, and digital seizure notice generation.
          </p>
        </div>

        {inspectionResult && (
          <button
            onClick={resetScanner}
            className="flex items-center space-x-2 bg-gradient-to-r from-gov-700 to-gov-800 hover:from-gov-600 hover:to-gov-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 shadow-lg transition duration-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Inspection Scan</span>
          </button>
        )}
      </div>

      {/* 1-Click Quick Demo Presets */}
      {!inspectionResult && (
        <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-cyan-500/20 bg-gradient-to-r from-gov-900/90 via-gov-850/80 to-gov-900/90">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-200">
              Quick Test Presets (Instant Label Audit):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadSamplePreset('non_compliant')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-700/60 flex items-center space-x-1.5 transition"
            >
              <AlertOctagon className="w-3 h-3 text-red-400" />
              <span>Sample 1: Delinquent Package (Violations)</span>
            </button>
            <button
              onClick={() => loadSamplePreset('compliant')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center space-x-1.5 transition"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Sample 2: Compliant Label (Full Metric USP)</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-sm flex items-center space-x-3 shadow-glow-red">
          <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Workstation Inputs (Before Analysis) */}
      {!inspectionResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Capture Workbench */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-4 sm:p-6 shadow-card-dark space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 shrink-0">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400"></span>
                <span>1. Capture Packaging Image</span>
              </h2>

              {/* Mode Switcher */}
              <div className="flex overflow-x-auto w-full sm:w-auto bg-gov-950/90 rounded-xl p-1 border border-white/[0.08] hide-scrollbar">
                <button
                  onClick={() => setMode('upload')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'upload'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => {
                    setMode('camera');
                    setCameraModalOpen(true);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'camera'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera</span>
                </button>
                <button
                  onClick={() => setMode('url')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'url'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>E-Commerce URL</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Drag & Drop */}
            {mode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                {!previewUrl ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-700 hover:border-cyan-400/80 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 bg-gov-950/40 hover:bg-gov-950/80 flex flex-col items-center justify-center min-h-[280px]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20 group-hover:scale-110 transition-transform shadow-glow-cyan">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Click to upload or drag packaging photo here
                    </span>
                    <span className="text-xs text-slate-400 mt-1 max-w-sm">
                      High-resolution photo of Front Principal Display Panel (PDP) or Information Panel (JPG, PNG, WEBP)
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gov-950 p-4 flex flex-col items-center shadow-inner">
                    <img
                      src={previewUrl}
                      alt="Packaging Preview"
                      className="max-h-[340px] w-auto object-contain rounded-xl border border-white/[0.06] shadow-2xl"
                    />
                    <div className="w-full flex justify-between items-center mt-3 pt-3 border-t border-white/[0.08]">
                      <span className="text-xs font-mono text-cyan-300 truncate max-w-xs">{file?.name}</span>
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl('');
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-bold transition"
                      >
                        Remove & Reselect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Live Camera Viewfinder */}
            {mode === 'camera' && (
              <div className="text-center p-8 bg-gov-950/60 rounded-2xl border border-white/[0.08] space-y-4">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Captured Label"
                      className="max-h-[300px] mx-auto object-contain rounded-xl border border-white/10 shadow-2xl"
                    />
                    <button
                      onClick={() => setCameraModalOpen(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      Retake with Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-14 h-14 text-cyan-400 mx-auto opacity-80 animate-pulse" />
                    <p className="text-sm text-slate-200 font-medium">
                      Align the Principal Display Panel (PDP) within the on-screen framing guide.
                    </p>
                    <button
                      onClick={() => setCameraModalOpen(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-glow-cyan transition duration-200"
                    >
                      Open Live Camera Viewfinder
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mode 3: E-Commerce URL */}
            {mode === 'url' && (
              <div className="space-y-3 bg-gov-950/70 p-6 rounded-2xl border border-white/[0.08]">
                <label className="text-xs font-bold text-slate-200 block">
                  Paste E-Commerce Product Listing URL (Amazon, Flipkart, Blinkit, Zepto):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.amazon.in/dp/B0..."
                    className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  CompliScan extracts high-resolution packaging images and audits mandatory digital commerce declarations under the Legal Metrology (Packaged Commodities) Amendment Rules, 2021.
                </p>
              </div>
            )}
          </div>

          {/* Right: Inspection Parameters & Trigger */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-card-dark space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-3 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>2. Inspection Context & Parameters</span>
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Product Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option className="bg-gov-950">Packaged Food & Beverage</option>
                  <option className="bg-gov-950">Personal Care & Cosmetics</option>
                  <option className="bg-gov-950">Household Cleaning & Detergents</option>
                  <option className="bg-gov-950">Electronics & Electrical Goods</option>
                  <option className="bg-gov-950">Apparel & Textiles</option>
                  <option className="bg-gov-950">General Packaged Commodity</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Estimated PDP Area (cm²)
                  </label>
                  <input
                    type="number"
                    value={pdpArea}
                    onChange={(e) => setPdpArea(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-cyan-400 mt-1 block">Rule 7 Min. Font Matrix</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Package Geometry
                  </label>
                  <select
                    value={pdpShape}
                    onChange={(e) => setPdpShape(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="RECTANGULAR" className="bg-gov-950">Rectangular Carton/Pouch</option>
                    <option value="CYLINDRICAL" className="bg-gov-950">Cylindrical Bottle/Tin</option>
                    <option value="SPECIAL" className="bg-gov-950">Special Shape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Inspected Store / Retail Entity</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>District / Enforcement Zone</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Run Analysis Button & Progress */}
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <button
                onClick={runAnalysis}
                disabled={loading || (mode !== 'url' && !file) || (mode === 'url' && !urlInput.trim())}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-glow-cyan flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Executing Tech Setu Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-cyan-200" />
                    <span>Run LMPC 2011 Compliance Audit</span>
                  </>
                )}
              </button>

              {/* Progress Indicator */}
              {loading && (
                <div className="p-4 bg-gov-950/90 rounded-xl border border-cyan-500/30 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-cyan-300">
                    <span className="font-bold">Execution Progress</span>
                    <span className="font-extrabold">{Math.min(100, pipelineStep * 20)}%</span>
                  </div>
                  <div className="w-full bg-gov-900 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pipelineStep * 20)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>
                      {pipelineStep === 1 && '1. Validating package capture...'}
                      {pipelineStep === 2 && '2. OpenCV Pre-processing (Auto-Deskew & Contrast CLAHE)...'}
                      {pipelineStep === 3 && '3. Spatial Dimension & Font Height Extraction...'}
                      {pipelineStep === 4 && '4. Gemini Flash AI + Deterministic LMPC 2011 Engine...'}
                      {pipelineStep >= 5 && '5. Compiling Official Form 1 Notice & Evidence...'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Viewport */}
      {inspectionResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner Ribbon */}
          <div className="glass-panel rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-card-dark">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-extrabold text-white">
                    {inspectionResult.product_name}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gov-800 text-cyan-300 border border-white/10">
                    {inspectionResult.brand}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Inspected at {inspectionResult.store_name} • {inspectionResult.location}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 shadow-sm">
                Memo Ref: {inspectionResult.notice_number}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Canvas */}
            <div className="lg:col-span-7 h-[500px] lg:h-[720px]">
              <InspectionCanvas
                inspection={inspectionResult}
                selectedDecl={selectedDecl}
                onSelectDecl={setSelectedDecl}
              />
            </div>

            {/* Right: Summary, Matrix, Font Analysis */}
            <div className="lg:col-span-5 space-y-6">
              <ViolationSummary inspection={inspectionResult} />
              <DeclarationTable
                declarations={inspectionResult.declarations}
                selectedDecl={selectedDecl}
                onSelectDecl={setSelectedDecl}
              />
              <FontAnalysisCard
                pdpArea={inspectionResult.pdp_area_sqcm}
                declarations={inspectionResult.declarations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => {
          setCameraModalOpen(false);
          if (!file) setMode('upload');
        }}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
