import { useState, useEffect, useRef, useCallback } from 'react';

interface CameraState {
  stream: MediaStream | null;
  error: string | null;
  isRecording: boolean;
  isPaused: boolean;
  photo: string | null;
  video: string | null;
  devices: MediaDeviceInfo[];
  zoomLevel: number;
  torchEnabled: boolean;
  supportedFeatures: {
    zoom: boolean;
    torch: boolean;
    focus: boolean;
  };
}

interface CameraOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  facingMode?: 'user' | 'environment';
  resolution?: 'low' | 'medium' | 'high' | 'ultra';
  enableZoom?: boolean;
  enableTorch?: boolean;
}

export const useCamera = (options: CameraOptions = {}) => {
  const {
    video = true,
    audio = false,
    facingMode = 'user',
    resolution = 'medium',
    enableZoom = true,
    enableTorch = false
  } = options;
  
  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    isRecording: false,
    isPaused: false,
    photo: null,
    video: null,
    devices: [],
    zoomLevel: 1,
    torchEnabled: false,
    supportedFeatures: {
      zoom: false,
      torch: false,
      focus: false
    }
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Get available media devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setState(prev => ({ ...prev, devices }));
    } catch (error) {
      console.error('Error getting media devices:', error);
    }
  }, []);
  
  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Set resolution constraints
      const resolutionConstraints = {
        low: { width: { ideal: 640 }, height: { ideal: 480 } },
        medium: { width: { ideal: 1280 }, height: { ideal: 720 } },
        high: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        ultra: { width: { ideal: 3840 }, height: { ideal: 2160 } }
      };
      
      const videoConstraints = video === true ? { 
        facingMode,
        ...resolutionConstraints[resolution]
      } : video;
      
      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Check supported features
      const supportedFeatures = {
        zoom: false,
        torch: false,
        focus: false
      };
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities();
        
        // Check zoom support
        if (capabilities.zoom && enableZoom) {
          supportedFeatures.zoom = true;
        }
        
        // Check torch support
        if (capabilities.torch && enableTorch) {
          supportedFeatures.torch = true;
        }
        
        // Check focus support
        if (capabilities.focusMode) {
          supportedFeatures.focus = true;
        }
      }
      
      setState(prev => ({ ...prev, stream, error: null, supportedFeatures }));
      
      // Attach stream to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      let errorMessage = 'Failed to access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints cannot be satisfied.';
      }
      
      setState(prev => ({ ...prev, error: errorMessage, stream: null }));
    }
  }, [video, audio, facingMode]);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, stream: null }));
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [state.stream]);
  
  // Take photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg');
      setState(prev => ({ ...prev, photo: photoData }));
      return photoData;
    }
    
    return null;
  }, []);
  
  // Start recording
  const startRecording = useCallback(() => {
    if (!state.stream) return;
    
    try {
      recordedChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(state.stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setState(prev => ({ ...prev, video: videoUrl }));
      };
      
      mediaRecorderRef.current.start();
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ ...prev, error: 'Failed to start recording' }));
    }
  }, [state.stream]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, [state.isRecording]);
  
  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (state.stream) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [state.stream, startCamera, stopCamera]);
  
  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);
  
  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);
  
  // Set zoom level
  const setZoom = useCallback((zoom: number) => {
    if (!state.stream || !state.supportedFeatures.zoom) return;
    
    const videoTrack = state.stream.getVideoTracks()[0];
    if (videoTrack) {
      const constraints: MediaTrackConstraints = {
        // @ts-ignore
        advanced: [{ zoom: zoom }]
      };
      
      videoTrack.applyConstraints(constraints);
      setState(prev => ({ ...prev, zoomLevel: zoom }));
    }
  }, [state.stream, state.supportedFeatures.zoom]);
  
  // Toggle torch
  const toggleTorch = useCallback(() => {
    if (!state.stream || !state.supportedFeatures.torch) return;
    
    const videoTrack = state.stream.getVideoTracks()[0];
    if (videoTrack) {
      const constraints: MediaTrackConstraints = {
        // @ts-ignore
        advanced: [{ torch: !state.torchEnabled }]
      };
      
      videoTrack.applyConstraints(constraints);
      setState(prev => ({ ...prev, torchEnabled: !prev.torchEnabled }));
    }
  }, [state.stream, state.supportedFeatures.torch, state.torchEnabled]);
  
  // Set focus point
  const setFocusPoint = useCallback((x: number, y: number) => {
    if (!state.stream || !state.supportedFeatures.focus) return;
    
    const videoTrack = state.stream.getVideoTracks()[0];
    if (videoTrack) {
      const constraints: MediaTrackConstraints = {
        // @ts-ignore
        advanced: [{ focusMode: 'manual', pointsOfInterest: [{ x, y }] }]
      };
      
      videoTrack.applyConstraints(constraints);
    }
  }, [state.stream, state.supportedFeatures.focus]);
  
  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    stopCamera();
    
    // Switch facing mode

    
    // Restart camera with new facing mode
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [facingMode, startCamera, stopCamera]);
  
  // Initialize on mount
  useEffect(() => {
    getDevices();
    
    return () => {
      stopCamera();
      stopRecording();
      
      // Clean up object URLs
      if (state.photo) {
        URL.revokeObjectURL(state.photo);
      }
      if (state.video) {
        URL.revokeObjectURL(state.video);
      }
    };
  }, [getDevices, stopCamera, stopRecording, state.photo, state.video]);
  
  // Get video element ref
  const getVideoRef = useCallback(() => videoRef, []);
  
  return {
    ...state,
    videoRef: getVideoRef(),
    startCamera,
    stopCamera,
    takePhoto,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleCamera,
    switchCamera,
    setZoom,
    toggleTorch,
    setFocusPoint,
    getDevices
  };
};