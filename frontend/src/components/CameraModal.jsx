import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // environment for back camera

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

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
      setCameraError('Camera access denied or unavailable. Please upload an image file instead.');
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
        const file = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedPhoto({ file, previewUrl });
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleConfirm = () => {
    if (capturedPhoto?.file) {
      onCapture(capturedPhoto.file);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gov-900 border border-gov-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gov-950 px-5 py-3 border-b border-gov-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Live Packaging Camera Viewfinder</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px]">
          {cameraError ? (
            <div className="p-6 text-center text-red-400 max-w-sm">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p className="text-xs">{cameraError}</p>
            </div>
          ) : capturedPhoto ? (
            <img src={capturedPhoto.previewUrl} alt="Captured Label" className="max-h-full max-w-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Principal Display Panel Framing Guide */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-cyan-400/80 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[11px] font-mono text-cyan-300 bg-gov-950/80 px-2 py-0.5 rounded self-start border border-cyan-500/40">
                  Align Principal Display Panel (PDP) Here
                </span>
                <span className="text-[10px] text-gray-300 bg-gov-950/70 px-2 py-0.5 rounded self-center">
                  Ensure MRP, Net Qty & Address are in focus
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="bg-gov-950 px-5 py-4 border-t border-gov-700 flex items-center justify-between">
          {!capturedPhoto ? (
            <>
              <button
                onClick={toggleCameraFacing}
                className="text-xs text-gray-300 hover:text-white flex items-center space-x-1 px-3 py-2 rounded-lg bg-gov-800 border border-gov-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Switch Camera</span>
              </button>

              <button
                onClick={handleSnap}
                className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-white transition transform active:scale-95"
                title="Capture Photo"
              >
                <Camera className="w-6 h-6 text-gov-950" />
              </button>

              <button onClick={onClose} className="text-xs text-gray-400 hover:text-white px-3 py-2">
                Cancel
              </button>
            </>
          ) : (
            <div className="flex w-full space-x-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gov-800 hover:bg-gov-700 text-gray-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border border-gov-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Inspect</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
