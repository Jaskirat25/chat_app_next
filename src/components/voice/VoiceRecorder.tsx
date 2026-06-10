"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Trash2, Send, Loader2, Square } from "lucide-react";

interface VoiceRecorderProps {
  onSend: (audioUrl: string) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start recording automatically when mounted
    startRecording();

    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Recording not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for browsers that don't support audio/webm
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks on the stream to release the mic
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        if (audioBlob.size > 0) {
          await uploadAndSend(audioBlob);
        } else {
          onCancel();
        }
      };

      recorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(err.message || "Could not access microphone");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleCancel = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Clear chunks so we don't upload
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const uploadAndSend = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "voice_message.webm");

      const response = await fetch("/api/voice/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (data.secure_url) {
        onSend(data.secure_url);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (err: any) {
      console.error("Voice upload error:", err);
      setError("Failed to upload audio message");
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-1 items-center justify-between gap-4 px-2 py-1">
      {error ? (
        <div className="text-xs text-red-400 flex-1 truncate">{error}</div>
      ) : (
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <span className="text-sm font-semibold text-white/90 tabular-nums">
            {formatTime(recordingTime)}
          </span>
          <div className="flex items-center gap-1.5 flex-1">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((recordingTime / 30) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isUploading}
          className="p-2 rounded-full text-white/50 hover:bg-white/10 hover:text-red-400 transition"
          title="Cancel recording"
        >
          <Trash2 size={18} />
        </button>

        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition animate-pulse"
            title="Stop and send"
          >
            <Square size={16} />
          </button>
        ) : isUploading ? (
          <div className="p-2 text-[#4CD964]">
            <Loader2 className="animate-spin" size={18} />
          </div>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="p-2 rounded-full bg-[#4CD964] text-black hover:bg-[#39c856] transition"
            title="Start recording"
          >
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
