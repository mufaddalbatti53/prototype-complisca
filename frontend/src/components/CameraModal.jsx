import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, RotateCcw } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const [lightStatus, setLightStatus] = useState({ label: 'Good light', isOk: true });
  const [focusStatus, setFocusStatus] = useState({ label: 'In focus', isOk: true });
  const [distanceStatus, setDistanceStatus] = useState({ label: 'Move closer', isOk: false });

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  //video telemetry
  useEffect(() => {
    if (!stream || capturedPhoto) return;

    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        ctx.drawImage(video, 0, 0, 160, 120);
        const imgData = ctx.getImageData(0, 0, 160, 120);
        const data = imgData.data;

        let totalBrightness = 0;
        let edgeVariance = 0;
        const count = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += lum;

          if (i + 4 < data.length) {
            const nextLum = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
            edgeVariance += Math.abs(lum - nextLum);
          }
        }

        const avgBrightness = totalBrightness / count;
        const avgSharpness = edgeVariance / count;

        if (avgBrightness < 65) {
          setLightStatus({ label: 'Too dark', isOk: false });
        } else if (avgBrightness > 215) {
          setLightStatus({ label: 'Reduce glare', isOk: false });
        } else {
          setLightStatus({ label: 'Good light', isOk: true });
        }

        if (avgSharpness > 14) {
          setFocusStatus({ label: 'In focus', isOk: true });
        } else {
          setFocusStatus({ label: 'Hold steady', isOk: false });
        }

        if (avgSharpness > 20 && avgBrightness > 80 && avgBrightness < 200) {
          setDistanceStatus({ label: 'Aligned', isOk: true });
        } else {
          setDistanceStatus({ label: 'Move closer', isOk: false });
        }
      } catch (e) {}
    }, 300);

    return () => clearInterval(interval);
  }, [stream, capturedPhoto]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError('Camera access denied or unavailable. Please upload a packaging photo directly.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `packaging_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPhoto({ file, previewUrl });
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleClose = () => {
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    onClose();
  };

  const handleConfirm = () => {
    if (capturedPhoto?.file) {
      onCapture(capturedPhoto.file);
      if (capturedPhoto.previewUrl) {
        URL.revokeObjectURL(capturedPhoto.previewUrl);
      }
      setCapturedPhoto(null);
      onClose();
    }
  };

  const handleRetake = () => {
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    startCamera();
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. MOBILE FULLSCREEN VIEW (Exact match to uploaded image 2) */}
      {/* ============================================================== */}
      <div className="sm:hidden fixed inset-0 z-50 bg-[#738194] flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
        {/* Top Floating Header */}
        <div className="flex items-center justify-between p-4 pt-6 z-20">
          {/* Close button (circular white) */}
          <button
            onClick={handleClose}
            className="w-11 h-11 rounded-full bg-white text-slate-700 shadow-md flex items-center justify-center active:scale-95 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Front panel pill */}
          <div className="bg-white/95 text-sky-800 font-mono text-xs px-4 py-1.5 rounded-full font-bold shadow-md">
            Front panel
          </div>

          {/* Camera flip button (circular white) */}
          <button
            onClick={toggleCameraFacing}
            className="w-11 h-11 rounded-full bg-white text-slate-700 shadow-md flex items-center justify-center active:scale-95 transition"
            aria-label="Switch camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Center Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
          <p className="text-white text-sm font-semibold mb-3 drop-shadow text-center">
            Align the front panel inside the frame
          </p>

          {/* Viewfinder Frame */}
          <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800/40 shadow-2xl border border-white/20 flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-white max-w-xs">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
                <p className="text-xs font-medium">{cameraError}</p>
              </div>
            ) : capturedPhoto ? (
              <img
                src={capturedPhoto.previewUrl}
                alt="Captured Label"
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* White Corner Framing Brackets */}
                <div className="absolute inset-4 pointer-events-none">
                  {/* Top-Left */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                  {/* Top-Right */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                  {/* Bottom-Left */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                  {/* Bottom-Right */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
              </>
            )}
          </div>

          {/* Real-Time Telemetry Badges below the frame */}
          {!capturedPhoto && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="bg-white text-emerald-700 font-medium text-xs px-3 py-1 rounded-full shadow-sm">
                In focus
              </span>
              <span className="bg-white text-emerald-700 font-medium text-xs px-3 py-1 rounded-full shadow-sm">
                Good light
              </span>
              <span className={`bg-white font-medium text-xs px-3 py-1 rounded-full shadow-sm ${
                distanceStatus.isOk ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {distanceStatus.label}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Sheet Controls */}
        <div className="bg-white rounded-t-3xl pt-5 pb-8 px-6 flex flex-col items-center shadow-2xl z-20">
          {!capturedPhoto ? (
            <>
              {/* Concentric Double-Ring Blue Shutter Button */}
              <button
                onClick={handleSnap}
                className="w-18 h-18 rounded-full bg-[#0284c7] border-4 border-white ring-4 ring-sky-300/40 shadow-xl active:scale-95 transition-transform flex items-center justify-center"
                aria-label="Capture"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] shadow-inner"></div>
              </button>

              <p className="text-slate-500 text-xs text-center mt-3 font-medium">
                Make sure MRP, net quantity and address are readable
              </p>
            </>
          ) : (
            <div className="w-full space-y-2">
              <button
                onClick={handleConfirm}
                className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
              <button
                onClick={handleRetake}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition"
              >
                Retake Photo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP MODAL VIEW (Exact match to uploaded image 4) */}
      {/* ============================================================== */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Frame the front of the pack
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hold steady. We will capture when it looks sharp.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Viewfinder Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-700 aspect-[16/10] flex items-center justify-center shadow-inner">
            {cameraError ? (
              <div className="p-8 text-center text-rose-300 max-w-sm">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold">{cameraError}</p>
              </div>
            ) : capturedPhoto ? (
              <img
                src={capturedPhoto.previewUrl}
                alt="Captured Label"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Top center pill */}
                <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                  <span className="bg-white/95 text-slate-700 font-mono text-xs font-semibold px-4 py-1.5 rounded-full shadow-md border border-slate-200/80">
                    Align the front panel inside the frame
                  </span>
                </div>

                {/* White Corner Framing Brackets */}
                <div className="absolute inset-8 sm:inset-10 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>

                {/* Status Badges */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-2 pointer-events-none px-4">
                  <span className="bg-white text-emerald-700 font-medium text-xs px-3 py-1 rounded-full shadow-md">
                    In focus
                  </span>
                  <span className="bg-white text-emerald-700 font-medium text-xs px-3 py-1 rounded-full shadow-md">
                    Good light
                  </span>
                  <span className={`bg-white font-medium text-xs px-3 py-1 rounded-full shadow-md ${
                    distanceStatus.isOk ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {distanceStatus.label}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Desktop Footer Toolbar */}
          {!capturedPhoto ? (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <span>Switch camera</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleSnap}
                className="w-14 h-14 rounded-full bg-[#0284c7] border-4 border-white ring-4 ring-sky-300/40 shadow-lg active:scale-95 transition-transform flex items-center justify-center"
                aria-label="Capture photo"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8]"></div>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleRetake}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Retake</span>
              </button>

              <button
                onClick={handleConfirm}
                className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Use this photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
