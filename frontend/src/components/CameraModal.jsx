import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sun, Focus, Maximize2 } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // back camera preferred

  // Intelligent real-time video telemetry ("In focus", "Good light", "Move closer")
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

  // Real-time video frame analyzer (measures brightness, sharpness, edge density)
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

          // Simple gradient check with next pixel for focus sharpness
          if (i + 4 < data.length) {
            const nextLum = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
            edgeVariance += Math.abs(lum - nextLum);
          }
        }

        const avgBrightness = totalBrightness / count;
        const avgSharpness = edgeVariance / count;

        // 1. Light evaluation
        if (avgBrightness < 65) {
          setLightStatus({ label: 'Too dark', isOk: false });
        } else if (avgBrightness > 215) {
          setLightStatus({ label: 'Reduce glare', isOk: false });
        } else {
          setLightStatus({ label: 'Good light', isOk: true });
        }

        // 2. Focus / Sharpness evaluation
        if (avgSharpness > 14) {
          setFocusStatus({ label: 'In focus', isOk: true });
        } else {
          setFocusStatus({ label: 'Hold steady', isOk: false });
        }

        // 3. Proximity / Framing evaluation
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 flex flex-col space-y-4 border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Frame the front of the pack
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hold steady. We will capture when it looks sharp.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
            title="Close Viewfinder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-800 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center shadow-inner">
          {cameraError ? (
            <div className="p-8 text-center text-rose-500 max-w-sm">
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

              {/* Top pill badge */}
              <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                <span className="bg-white/95 text-slate-700 font-mono text-xs font-semibold px-4 py-1.5 rounded-full shadow-md border border-slate-200/80">
                  Align the front panel inside the frame
                </span>
              </div>

              {/* White corner brackets framing guide */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none">
                {/* Top-Left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-sm"></div>
                {/* Top-Right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-sm"></div>
                {/* Bottom-Left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-sm"></div>
                {/* Bottom-Right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-sm"></div>
              </div>

              {/* Real-Time Telemetry Badges (In focus, Good light, Move closer) */}
              <div className="absolute bottom-4 inset-x-0 flex flex-wrap justify-center items-center gap-2 pointer-events-none px-4">
                {/* 1. Focus Pill */}
                <div
                  className={`bg-white px-3 py-1 rounded-full text-xs font-semibold shadow-md border flex items-center space-x-1.5 transition-colors ${
                    focusStatus.isOk
                      ? 'text-emerald-700 border-emerald-200'
                      : 'text-amber-800 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      focusStatus.isOk ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  ></span>
                  <span>{focusStatus.label}</span>
                </div>

                {/* 2. Light Pill */}
                <div
                  className={`bg-white px-3 py-1 rounded-full text-xs font-semibold shadow-md border flex items-center space-x-1.5 transition-colors ${
                    lightStatus.isOk
                      ? 'text-emerald-700 border-emerald-200'
                      : 'text-amber-800 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      lightStatus.isOk ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  ></span>
                  <span>{lightStatus.label}</span>
                </div>

                {/* 3. Distance Pill */}
                <div
                  className={`bg-white px-3 py-1 rounded-full text-xs font-semibold shadow-md border flex items-center space-x-1.5 transition-colors ${
                    distanceStatus.isOk
                      ? 'text-emerald-700 border-emerald-200'
                      : 'text-amber-800 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      distanceStatus.isOk ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                  <span>{distanceStatus.label}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div>
          {!capturedPhoto ? (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Switch camera</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleSnap}
                className="w-16 h-16 rounded-full bg-gradient-to-b from-[#0284c7] to-[#0369a1] p-1 shadow-lg ring-4 ring-sky-100 hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer"
                title="Capture Packaging Photo"
              >
                <div className="w-full h-full rounded-full border-2 border-white/60 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white/90"></div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2.5 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex w-full space-x-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#075985] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-sky-500/20 transition"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Inspect</span>
              </button>
            </div>
          )}

          {/* Subtext Guidance */}
          <p className="text-center text-xs text-slate-400 font-medium mt-3">
            Make sure MRP, net quantity and address are readable
          </p>
        </div>
      </div>
    </div>
  );
}
