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
import { broadcastSync } from '../services/sync';
import InspectionCanvas from '../components/InspectionCanvas';
import DeclarationTable from '../components/DeclarationTable';
import FontAnalysisCard from '../components/FontAnalysisCard';
import ViolationSummary from '../components/ViolationSummary';
import CameraModal from '../components/CameraModal';

const DEMO_PACKETS = [
  {
    id: 'bingo_mad_angles',
    title: 'Bingo! Mad Angles',
    subtitle: 'ITC Limited • Namkeen (15.1) • ₹5.00 MRP',
    filename: 'demo_bingo_mad_angles.jpg',
    thumbnail: '/samples/demo_bingo_mad_angles.jpg',
    pdpArea: 160.0,
    pdpShape: 'RECTANGULAR',
    category: 'Packaged Food & Beverage',
    storeName: 'Metro Cash & Carry, Rohini',
    location: 'New Delhi, India',
    badge: 'Snack Pouch',
    description: 'ITC Bingo! Mad Angles pouch back panel: Verifies Consumer Care, FSSAI QR, MRP ₹5.00, Dot-Matrix MFD/EXP & Unit Sale Price.'
  },
  {
    id: 'nestle_milkybar',
    title: 'Nestlé Milkybar',
    subtitle: 'Nestlé India • Confectionery • ₹20.00 MRP',
    filename: 'demo_nestle_milkybar.jpg',
    thumbnail: '/samples/demo_nestle_milkybar.jpg',
    pdpArea: 120.0,
    pdpShape: 'RECTANGULAR',
    category: 'Packaged Food & Beverage',
    storeName: 'Reliance Smart Bazaar',
    location: 'New Delhi, India',
    badge: 'Confectionery Carton',
    description: 'Nestlé Milkybar retail packaging carton: Verifies Net Qty 21g, Unit Sale Price ₹0.95/g, Barcode, FSSAI, and Nutritional Table.'
  }
];

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
  const [elapsedSeconds, setElapsedSeconds] = useState('0.0');
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

  // 1-Click Demo Packet Loader
  const loadDemoPacket = async (packetId) => {
    setErrorMsg(null);
    const packet = DEMO_PACKETS.find((p) => p.id === packetId) || DEMO_PACKETS[0];
    try {
      let response;
      try {
        response = await fetch(packet.thumbnail);
        if (!response.ok) throw new Error('Local sample not found');
      } catch (e) {
        response = await fetch(`${STORAGE_BASE}/storage/samples/${packet.filename}`);
      }
      const blob = await response.blob();
      const loadedFile = new File([blob], packet.filename, { type: 'image/jpeg' });
      setFile(loadedFile);
      setPreviewUrl(URL.createObjectURL(loadedFile));
      setPdpArea(packet.pdpArea);
      setPdpShape(packet.pdpShape);
      setCategory(packet.category);
      setStoreName(packet.storeName);
      setLocation(packet.location);
      setMode('upload');
    } catch (err) {
      console.error('Failed to load demo packet', err);
      setErrorMsg('Failed to load demo packet image. Please upload a file.');
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    setPipelineStep(1);
    setElapsedSeconds('0.0');

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);

    let pipelineTimers = [];
    try {
      let result = null;
      const savedLocalRules = sessionStorage.getItem('compliscan_local_rules');

      pipelineTimers.push(setTimeout(() => setPipelineStep(2), 1000));
      pipelineTimers.push(setTimeout(() => setPipelineStep(3), 2200));
      pipelineTimers.push(setTimeout(() => setPipelineStep(4), 3800));
      pipelineTimers.push(setTimeout(() => setPipelineStep(5), 5500));

      if (mode === 'url') {
        if (!urlInput.trim()) {
          throw new Error('Please enter a valid product listing URL.');
        }
        let localRulesParsed = null;
        try {
          if (savedLocalRules) {
            localRulesParsed = JSON.parse(savedLocalRules).map((r) => ({
              rule_code: r.rule_code,
              is_active: r.is_active,
              is_mandatory: r.is_mandatory,
              parameters: r.parameters
            }));
          }
        } catch (e) {}

        result = await api.scanUrl({
          url: urlInput.trim(),
          category,
          store_name: storeName,
          location,
          pdp_area_sqcm: parseFloat(pdpArea) || 120.0,
          rules_config: localRulesParsed
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

        if (savedLocalRules) {
          try {
            const rulesConfigPayload = JSON.stringify(
              JSON.parse(savedLocalRules).map((r) => ({
                rule_code: r.rule_code,
                is_active: r.is_active,
                is_mandatory: r.is_mandatory,
                parameters: r.parameters
              }))
            );
            formData.append('rules_config', rulesConfigPayload);
          } catch (e) {}
        }

        result = await api.uploadAndScan(formData);
      }

      // Smooth completion transition: flash 100% green before displaying evidence
      setPipelineStep(6);
      await new Promise((resolve) => setTimeout(resolve, 350));

      setInspectionResult(result);
      broadcastSync('INSPECTION_CREATED', result);
      if (result?.declarations?.length > 0) {
        setSelectedDecl(result.declarations[0]);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Inspection failed.');
    } finally {
      clearInterval(timerInterval);
      pipelineTimers.forEach((t) => clearTimeout(t));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 mb-1">
            NEW INSPECTION
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Check a package in seconds.
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Snap or upload the front of the pack. We read every mandatory declaration, measure the font height against Rule 7, and prepare the notice if something is off.
          </p>
        </div>

        {!inspectionResult ? (
          <div className="flex items-center gap-2 self-start md:self-end">
            {DEMO_PACKETS.map((packet) => (
              <button
                key={packet.id}
                type="button"
                onClick={() => loadDemoPacket(packet.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs hover:border-sky-500 transition-all flex items-center space-x-1.5"
              >
                <span>{packet.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={resetScanner}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            <span>New Inspection Scan</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-3 shadow-xs">
          <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Workstation Inputs (Before Analysis) */}
      {!inspectionResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Capture Workbench */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                1. Capture the pack
              </h2>

              {/* Mode Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs space-x-1">
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    mode === 'upload'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('camera');
                    setCameraModalOpen(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    mode === 'camera'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => setMode('url')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    mode === 'url'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Web link
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
                    className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center min-h-[260px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-3 shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      Drop a photo here, or browse
                    </span>
                    <span className="text-xs text-slate-400 mt-1 max-w-sm">
                      Best results: the front panel, flat, well lit. JPG, PNG or WEBP.
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-4 flex flex-col items-center shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Packaging Preview"
                      className="max-h-[320px] w-auto object-contain rounded-xl border border-slate-200/80 shadow-md"
                    />
                    <div className="w-full flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                      <span className="text-xs font-mono text-slate-700 font-semibold truncate max-w-xs">{file?.name}</span>
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold transition"
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
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Captured Label"
                      className="max-h-[300px] mx-auto object-contain rounded-xl border border-slate-200 shadow-md"
                    />
                    <button
                      onClick={() => setCameraModalOpen(true)}
                      className="text-xs text-sky-600 hover:text-sky-700 font-bold"
                    >
                      Retake with Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 mx-auto flex items-center justify-center shadow-xs">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-slate-700 font-medium">
                      Align the Principal Display Panel (PDP) within the on-screen framing guide.
                    </p>
                    <button
                      onClick={() => setCameraModalOpen(true)}
                      className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:from-[#0369a1] hover:to-[#075985] transition"
                    >
                      Open Live Camera Viewfinder
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mode 3: E-Commerce URL */}
            {mode === 'url' && (
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 block">
                  Paste E-Commerce Product Listing URL (Amazon, Flipkart, Blinkit, Zepto):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.amazon.in/dp/B0..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  CompliScan extracts high-resolution packaging images and audits mandatory digital commerce declarations under the Legal Metrology (Packaged Commodities) Amendment Rules, 2021.
                </p>
              </div>
            )}
          </div>

          {/* Right: Inspection Parameters & Trigger */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-xs border border-slate-200/80 bg-white space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                2. Where are you inspecting?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Product category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option>Packaged Food & Beverage</option>
                    <option>Personal Care & Cosmetics</option>
                    <option>Household Cleaning & Detergents</option>
                    <option>Electronics & Electrical Goods</option>
                    <option>Apparel & Textiles</option>
                    <option>General Packaged Commodity</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Package shape
                  </label>
                  <select
                    value={pdpShape}
                    onChange={(e) => setPdpShape(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="RECTANGULAR">Rectangular pouch</option>
                    <option value="CYLINDRICAL">Cylindrical bottle/tin</option>
                    <option value="SPECIAL">Special shape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Front panel area (cm²)
                  </label>
                  <input
                    type="number"
                    value={pdpArea}
                    onChange={(e) => setPdpArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Store or retailer
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Run Analysis Button & Progress */}
            <div className="pt-2 space-y-3">
              <button
                onClick={runAnalysis}
                disabled={loading || (mode !== 'url' && !file) || (mode === 'url' && !urlInput.trim())}
                className="w-full bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#075985] text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Executing Tech Setu Pipeline...</span>
                  </>
                ) : (
                  <span>Run compliance check</span>
                )}
              </button>

              {/* Progress Indicator */}
              {loading && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs font-mono shadow-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                      <span>Execution Progress</span>
                      <span className="text-slate-500 font-normal">({elapsedSeconds}s)</span>
                    </span>
                    <span className="font-extrabold text-sky-700">
                      {pipelineStep >= 6
                        ? '100%'
                        : pipelineStep === 5
                        ? '92%'
                        : pipelineStep === 4
                        ? '78%'
                        : pipelineStep === 3
                        ? '55%'
                        : pipelineStep === 2
                        ? '35%'
                        : '15%'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        pipelineStep >= 6
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-sky-500 to-blue-600'
                      }`}
                      style={{
                        width: `${
                          pipelineStep >= 6
                            ? 100
                            : pipelineStep === 5
                            ? 92
                            : pipelineStep === 4
                            ? 78
                            : pipelineStep === 3
                            ? 55
                            : pipelineStep === 2
                            ? 35
                            : 15
                        }%`
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1.5">
                      <span className="text-sky-600 font-bold">
                        {pipelineStep >= 6 ? '✓' : `[Stage ${Math.min(5, pipelineStep)}/5]`}:
                      </span>
                      <span>
                        {pipelineStep === 1 && '1. Validating package capture & color balance...'}
                        {pipelineStep === 2 && '2. OpenCV enhancement & resolution standardization...'}
                        {pipelineStep === 3 && '3. Multimodal Vision reading statutory label declarations...'}
                        {pipelineStep === 4 && '4. Deterministic LMPC 2011 Legal Rule Verification...'}
                        {pipelineStep === 5 && '5. Compiling Official Form 1 Notice & Evidence Locker...'}
                        {pipelineStep >= 6 && 'Statutory Inspection Complete!'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {pipelineStep >= 6 ? '100% Done' : 'Processing'}
                    </span>
                  </div>
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
          <div className="glass-panel rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 border border-slate-200 shadow-xs bg-white">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {inspectionResult.product_name}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {inspectionResult.brand}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Inspected at {inspectionResult.store_name} • {inspectionResult.location}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3.5 py-1.5 rounded-xl border border-sky-200 shadow-xs">
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
                previewUrl={previewUrl}
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
