"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Maximize2,
  Minimize2,
  Settings,
  MessageSquare,
  User,
  Share2,
  Monitor
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type Appointment, SPECIALTY_LABELS } from "@/lib/telemedicine";

/* ============================================
 * Types
 * ============================================
 */

interface VideoRoomProps {
  appointment: Appointment;
  sharedData?: {
    healthScore: number;
    concentration: number;
    trendData: { date: string; value: number }[];
  };
  onEndCall: () => void;
}

type ConnectionStatus = 
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

/* ============================================
 * Main Component
 * ============================================
 */

export function VideoRoom({ appointment, sharedData, onEndCall }: VideoRoomProps) {
  // Media State
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSharedData, setShowSharedData] = useState(false);
  
  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [connectionQuality, setConnectionQuality] = useState(85);
  const [callDuration, setCallDuration] = useState(0);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus("connected");
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (connectionStatus !== "connected") return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Connection quality simulation
  useEffect(() => {
    if (connectionStatus !== "connected") return;
    
    const interval = setInterval(() => {
      setConnectionQuality(80 + Math.random() * 20);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Get user camera (mock or real)
  useEffect(() => {
    if (isCameraOff) return;
    
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false // We're not actually using audio
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.log("[VideoRoom] Camera not available, using placeholder");
      }
    };
    
    getMedia();
    
    return () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOff]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Status color
  const statusColor = {
    connecting: "bg-yellow-500",
    connected: "bg-green-500",
    reconnecting: "bg-yellow-500",
    disconnected: "bg-red-500",
    error: "bg-red-500"
  };

  const statusText = {
    connecting: `${appointment.doctorName} 전문의에게 연결 중...`,
    connected: "연결됨",
    reconnecting: "재연결 중...",
    disconnected: "연결 끊김",
    error: "연결 오류"
  };

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle end call
  const handleEndCall = useCallback(() => {
    setConnectionStatus("disconnected");
    
    // Stop camera
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    onEndCall();
  }, [onEndCall]);

  return (
    <div 
      ref={containerRef}
      className={`bg-gray-900 rounded-xl overflow-hidden flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50" : "h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColor[connectionStatus]} animate-pulse`} />
          <div className="text-white">
            <div className="text-sm font-medium">{appointment.doctorName} 전문의</div>
            <div className="text-xs text-gray-400">
              {SPECIALTY_LABELS[appointment.specialty]} • {appointment.hospitalName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connectionStatus === "connected" && (
            <>
              <Badge variant="secondary" className="text-xs">
                🕐 {formatDuration(callDuration)}
              </Badge>
              <div className="flex items-center gap-1">
                <div className={`text-xs ${
                  connectionQuality >= 80 ? "text-green-400" : 
                  connectionQuality >= 60 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {connectionQuality.toFixed(0)}%
                </div>
                <Progress value={connectionQuality} className="w-16 h-1.5" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Doctor) - Main */}
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          {connectionStatus === "connecting" ? (
            <div className="text-center text-white">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="text-lg">{statusText[connectionStatus]}</div>
              <div className="text-sm text-gray-400 mt-2">
                잠시만 기다려주세요...
              </div>
              <Progress value={undefined} className="w-48 mx-auto mt-4 h-1" />
            </div>
          ) : connectionStatus === "connected" ? (
            // Mock doctor video - placeholder avatar
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-800">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-primary/30 flex items-center justify-center border-4 border-primary/50">
                  <User className="w-16 h-16 text-primary" />
                </div>
                <div className="text-white text-lg font-medium">{appointment.doctorName} 전문의</div>
                <div className="text-gray-400 text-sm mt-1">화상 진료 중</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-white">
              <PhoneOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <div className="text-lg">{statusText[connectionStatus]}</div>
            </div>
          )}
        </div>

        {/* Local Video (User) - PiP */}
        <div className={`absolute bottom-4 right-4 w-40 h-28 rounded-lg overflow-hidden border-2 border-white/30 bg-gray-900 ${
          isCameraOff ? "flex items-center justify-center" : ""
        }`}>
          {isCameraOff ? (
            <div className="text-center">
              <VideoOff className="w-8 h-8 text-gray-500 mx-auto" />
              <div className="text-xs text-gray-500 mt-1">카메라 꺼짐</div>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-1 left-1">
            <Badge variant="secondary" className="text-[10px] px-1">나</Badge>
          </div>
        </div>

        {/* Shared Data Panel */}
        {showSharedData && sharedData && appointment.dataShareConsent && (
          <div className="absolute top-4 left-4 w-64 bg-gray-800/90 backdrop-blur rounded-lg p-3 text-white">
            <div className="text-xs font-medium mb-2 flex items-center gap-2">
              <Share2 className="w-3 h-3" />
              공유된 건강 데이터
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Health Score</span>
                <span className={`font-medium ${
                  sharedData.healthScore >= 80 ? "text-green-400" :
                  sharedData.healthScore >= 60 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {sharedData.healthScore}/100
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">젖산 농도</span>
                <span className="font-medium">{sharedData.concentration.toFixed(2)} mmol/L</span>
              </div>
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-2 mt-2">
                🔒 진료 종료 시 접근 권한 만료
              </div>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute top-4 right-48 w-64 h-80 bg-gray-800/90 backdrop-blur rounded-lg flex flex-col">
            <div className="p-2 border-b border-gray-700 text-white text-sm font-medium">
              채팅
            </div>
            <div className="flex-1 p-2 overflow-auto text-sm">
              <div className="text-gray-400 text-center text-xs">
                채팅 기록이 없습니다
              </div>
            </div>
            <div className="p-2 border-t border-gray-700">
              <input
                type="text"
                placeholder="메시지 입력..."
                className="w-full p-2 rounded bg-gray-700 text-white text-sm placeholder:text-gray-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800/80 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          {/* Mute */}
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Camera */}
          <Button
            variant={isCameraOff ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setIsCameraOff(!isCameraOff)}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          {/* Chat */}
          <Button
            variant={showChat ? "default" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* Share Data (if consent given) */}
          {appointment.dataShareConsent && (
            <Button
              variant={showSharedData ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={() => setShowSharedData(!showSharedData)}
            >
              <Monitor className="w-5 h-5" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* Status bar */}
        <div className="text-center text-xs text-gray-500 mt-2">
          {connectionStatus === "connected" && (
            <>
              {isMuted && "🔇 음소거됨 • "}
              {isCameraOff && "📷 카메라 꺼짐 • "}
              {appointment.dataShareConsent && "🔒 건강 데이터 공유됨"}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoRoom;






