import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMeetingMessages,
  sendMeetingMessage,
  sendMeetingSignal,
  getSSEEventsUrl,
  endMeeting
} from '../services/courseService';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Camera,
  Loader2,
  Sparkles,
  Monitor,
  MonitorOff,
  MessageSquare,
  Send,
  X,
  VolumeX,
  UserX,
  Crown,
  Radio,
  Shield
} from 'lucide-react';

function RemoteVideoTile({ peer, stream, isHost, onRequestCam, onMute, onKick }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (!stream) {
      setHasVideo(false);
      return;
    }

    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
    if (audioRef.current && audioRef.current.srcObject !== stream) {
      audioRef.current.srcObject = stream;
    }

    const checkTrack = () => {
      const vTracks = stream ? stream.getVideoTracks() : [];
      const hasLiveTrack = vTracks.length > 0 && vTracks.some((t) => t.readyState === 'live');
      const shouldShow = hasLiveTrack && !peer.isCamOff;
      setHasVideo(shouldShow);
      if (shouldShow && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    checkTrack();

    stream.getVideoTracks().forEach((track) => {
      track.onunmute = checkTrack;
      track.onended = checkTrack;
      track.onmute = checkTrack;
    });

    const interval = setInterval(checkTrack, 800);
    return () => clearInterval(interval);
  }, [stream, peer.isCamOff]);

  const peerIsHost = peer.role === 'teacher';

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center group shadow-xl min-h-[220px]">
      {/* Remote Video - muted to guarantee autoplay without browser gesture block */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${
          hasVideo ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
        }`}
      />
      {/* Audio element plays the remote peer's sound */}
      <audio ref={audioRef} autoPlay playsInline />

      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-10 z-0">
          <div
            className={`w-16 h-16 rounded-full bg-slate-950 border flex items-center justify-center text-2xl font-black uppercase shadow-lg ${
              peerIsHost
                ? 'border-purple-500/40 text-purple-400'
                : 'border-cyan-500/40 text-cyan-400'
            }`}
          >
            {peer.name?.[0] || 'P'}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {peer.isCamOff ? 'Camera Off' : 'Live Media Connected'}
          </span>
        </div>
      )}

      {/* Remote Tile Badge / Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs z-10">
        <span className="font-bold text-white flex items-center gap-1.5 truncate max-w-[130px]">
          <span>{peer.name}</span>
          {peerIsHost && (
            <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[9px] font-extrabold uppercase">
              Host
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Host Actions on Participant */}
          {isHost && !peerIsHost && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRequestCam(peer.identity, peer.name)}
                className="p-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white transition-colors"
                title={`Request ${peer.name} to turn on camera`}
              >
                <Camera size={12} />
              </button>
              <button
                onClick={() => onMute(peer.identity, peer.name)}
                className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white transition-colors"
                title={`Mute ${peer.name}`}
              >
                <VolumeX size={12} />
              </button>
              <button
                onClick={() => onKick(peer.identity, peer.name)}
                className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors"
                title={`Remove ${peer.name} from meeting`}
              >
                <UserX size={12} />
              </button>
            </div>
          )}

          <span
            className={`p-1 rounded ${
              peer.isMicMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {peer.isMicMuted ? <MicOff size={12} /> : <Mic size={12} />}
          </span>
          <span
            className={`p-1 rounded ${
              peer.isCamOff ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {peer.isCamOff ? <VideoOff size={12} /> : <Video size={12} />}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MeetingRoom({ roomCode, meetingTitle, userRole = 'student', onLeave }) {
  const { user } = useAuth();
  const currentUserId = user?._id?.toString() || 'usr_unknown';
  const currentUserName = user?.name || (userRole === 'teacher' ? 'Instructor' : 'Student');
  const isHost = userRole === 'teacher' || user?.role === 'teacher' || user?.role === 'admin';

  // Media & Devices State
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenShare, setRemoteScreenShare] = useState(null); // { presenterId, presenterName, streamId }
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // peerId -> MediaStream

  // Peers State: map of peerId -> { identity, name, role, isMicMuted, isCamOff }
  const [peers, setPeers] = useState({});

  // UI Drawer & Modal States
  const [activeDrawer, setActiveDrawer] = useState(null); // 'chat' | 'participants' | null
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // In-Meeting Chat State (with reload persistence)
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Student Camera Request Modal
  const [camRequestModal, setCamRequestModal] = useState({
    isOpen: false,
    senderIdentity: '',
    senderName: 'Teacher'
  });

  // Element Refs & WebRTC Tracking Refs
  const localVideoRef = useRef(null);
  const localScreenRef = useRef(null);
  const remoteScreenRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnections = useRef({}); // peerId -> RTCPeerConnection
  const iceCandidateQueues = useRef({}); // peerId -> RTCIceCandidate[]
  const remoteStreamsRef = useRef({});
  const remoteScreenShareRef = useRef(null);
  const isCamOnRef = useRef(false);
  const isMicOnRef = useRef(false);
  const chatBottomRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Keep refs in sync with states
  useEffect(() => {
    isCamOnRef.current = isCamOn;
  }, [isCamOn]);
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);
  useEffect(() => {
    remoteScreenShareRef.current = remoteScreenShare;
  }, [remoteScreenShare]);
  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
  }, [remoteStreams]);

  // STUN Configuration with candidate pool
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10
  };

  // Show temporary toast notification
  const showToast = (text, type = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4500);
  };

  // Helper to send signal to backend
  const sendSignal = async (type, targetIdentity = null, payload = {}, signalData = null) => {
    try {
      await sendMeetingSignal(roomCode, {
        type,
        targetIdentity,
        payload,
        signalData
      });
    } catch (err) {
      console.warn('Signal send error:', err.message);
    }
  };

  // Helper: Create dynamic animated fallback stream (renders live animated canvas at 25fps)
  const createFallbackStream = (label = 'User') => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const drawFrame = () => {
      frame++;
      // Dark gradient background
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(0.5, '#131b31');
      grad.addColorStop(1, '#0a0f1d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Pulsing glow circle
      const pulse = Math.sin(frame * 0.08) * 8;
      ctx.beginPath();
      ctx.arc(320, 190, 65 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();

      // Center avatar circle
      ctx.beginPath();
      ctx.arc(320, 190, 55, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Avatar letter
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label[0]?.toUpperCase() || 'U', 320, 190);

      // User name
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(label, 320, 280);

      // Live tag and timestamp
      const timeStr = new Date().toLocaleTimeString();
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText(`LIVE STREAM • ${timeStr}`, 320, 310);

      // Animated equalizer bars
      for (let i = 0; i < 9; i++) {
        const barHeight = Math.abs(Math.sin(frame * 0.12 + i * 0.7)) * 22 + 4;
        const x = 244 + i * 18;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x, 370 - barHeight, 10, barHeight);
      }
    };

    drawFrame();
    const animInterval = setInterval(drawFrame, 1000 / 25);

    const canvasStream = canvas.captureStream(25);
    const videoTrack = canvasStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack._isSynthetic = true;
      videoTrack.enabled = false;
      const originalStop = videoTrack.stop.bind(videoTrack);
      videoTrack.stop = () => {
        clearInterval(animInterval);
        originalStop();
      };
    }

    let audioTrack;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0; // silent
        osc.connect(gain);
        const dest = audioCtx.createMediaStreamDestination();
        gain.connect(dest);
        osc.start();
        audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack._isSynthetic = true;
          audioTrack.enabled = false;
        }
      }
    } catch (e) {}

    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);
    return new MediaStream(tracks);
  };

  // 1. Initialize Local Camera & Microphone Stream
  useEffect(() => {
    let activeMediaStream = null;

    async function setupLocalMedia() {
      let stream = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
          // Default initially to mic & cam off
          stream.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
      } catch (err) {
        console.warn('Media devices access notice (using dynamic fallback stream):', err.message);
      }

      if (!stream) {
        stream = createFallbackStream(currentUserName);
      }

      activeMediaStream = stream;
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCamOn(false);
      setIsMicOn(false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
    }

    setupLocalMedia();

    return () => {
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [currentUserName]);

  // Update local video element when cam toggled
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (isCamOn) {
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [localStream, isCamOn]);

  // WebRTC Peer Connection Factory
  const createPeerConnection = (targetPeerId) => {
    if (peerConnections.current[targetPeerId]) {
      return peerConnections.current[targetPeerId];
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current[targetPeerId] = pc;

    // Attach local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Attach screen tracks if currently sharing screen
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, screenStreamRef.current);
      });
    }

    // Handle remote tracks from this peer
    pc.ontrack = (event) => {
      const incomingTrack = event.track;
      const incomingStream = event.streams[0];

      const isScreen =
        incomingTrack.label.toLowerCase().includes('screen') ||
        incomingTrack.label.toLowerCase().includes('display') ||
        (remoteScreenShareRef.current &&
          remoteScreenShareRef.current.presenterId === targetPeerId &&
          incomingTrack.kind === 'video' &&
          remoteStreamsRef.current[targetPeerId]?.getVideoTracks().length > 0 &&
          !remoteStreamsRef.current[targetPeerId].getVideoTracks().includes(incomingTrack));

      if (isScreen) {
        const streamToUse = incomingStream || new MediaStream([incomingTrack]);
        setRemoteScreenStream(streamToUse);
        if (remoteScreenRef.current) {
          remoteScreenRef.current.srcObject = streamToUse;
          remoteScreenRef.current.play().catch(() => {});
        }
      } else {
        setRemoteStreams((prev) => {
          const current = prev[targetPeerId];
          let updatedStream;
          if (current) {
            if (current.getTracks().some((t) => t.id === incomingTrack.id)) {
              return prev;
            }
            const filteredTracks = current.getTracks().filter((t) => t.id !== incomingTrack.id);
            updatedStream = new MediaStream([...filteredTracks, incomingTrack]);
          } else {
            updatedStream = incomingStream || new MediaStream([incomingTrack]);
          }
          return { ...prev, [targetPeerId]: updatedStream };
        });
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('RTC_ICE', targetPeerId, null, event.candidate);
      }
    };

    return pc;
  };

  // Helper to initiate offer to peer
  const initiateOffer = async (targetPeerId) => {
    try {
      const pc = createPeerConnection(targetPeerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal('RTC_OFFER', targetPeerId, { isCamOn: isCamOnRef.current, isMicOn: isMicOnRef.current }, offer);
    } catch (err) {
      console.warn('Error initiating offer to peer:', targetPeerId, err);
    }
  };

  // 2. Load In-Meeting Chat Messages (Reload Persistence)
  useEffect(() => {
    async function loadChatHistory() {
      try {
        const res = await getMeetingMessages(roomCode);
        if (res.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.warn('Could not load chat history:', err.message);
      }
    }

    loadChatHistory();
  }, [roomCode]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeDrawer === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeDrawer]);

  // 3. Connect to Real-time SSE Signaling Channel
  useEffect(() => {
    const sseUrl = getSSEEventsUrl(roomCode);
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingSignal(data);
      } catch (err) {
        // Heartbeat or malformed ping
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE connection notice (will auto-reconnect if server restarts):', err);
    };

    return () => {
      eventSource.close();
    };
  }, [roomCode]);

  // 4. Signal Dispatcher Handler
  const handleIncomingSignal = async (data) => {
    const { type, senderIdentity, senderName, senderRole, payload, signalData, message } = data;

    switch (type) {
      case 'INIT_ROOM': {
        // Existing peers in the room
        if (Array.isArray(data.peers)) {
          const peerMap = {};
          data.peers.forEach((p) => {
            peerMap[p.identity] = {
              identity: p.identity,
              name: p.name,
              role: p.role,
              isMicMuted: false,
              isCamOff: false
            };
            // The newly joined client initiates the offer to each existing peer
            initiateOffer(p.identity);
          });
          setPeers(peerMap);
        }
        break;
      }

      case 'PEER_JOINED': {
        if (data.peer && data.peer.identity !== currentUserId) {
          const peerId = data.peer.identity;
          setPeers((prev) => ({
            ...prev,
            [peerId]: {
              identity: peerId,
              name: data.peer.name,
              role: data.peer.role,
              isMicMuted: false,
              isCamOff: false
            }
          }));
          showToast(`${data.peer.name} (${data.peer.role}) joined the meeting`, 'info');
          // Note: Joining peer initiates the offer via INIT_ROOM; existing peer waits for RTC_OFFER to avoid glare
        }
        break;
      }

      case 'RTC_OFFER': {
        if (senderIdentity && signalData) {
          try {
            const pc = createPeerConnection(senderIdentity);
            // Handle offer collision via polite peer pattern
            const isPolite = currentUserId > senderIdentity;
            if (pc.signalingState !== 'stable') {
              if (!isPolite) {
                console.log('Offer collision detected, impolite peer ignoring offer from:', senderIdentity);
                return;
              }
              await pc.setLocalDescription({ type: 'rollback' });
            }

            await pc.setRemoteDescription(new RTCSessionDescription(signalData));

            // Drain queued ICE candidates
            if (iceCandidateQueues.current[senderIdentity]) {
              for (const cand of iceCandidateQueues.current[senderIdentity]) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
              }
              iceCandidateQueues.current[senderIdentity] = [];
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal('RTC_ANSWER', senderIdentity, { isCamOn: isCamOnRef.current, isMicOn: isMicOnRef.current }, answer);

            // Update peer media status from offer payload
            if (payload) {
              setPeers((prev) => {
                if (!prev[senderIdentity]) return prev;
                return {
                  ...prev,
                  [senderIdentity]: {
                    ...prev[senderIdentity],
                    isCamOff: payload.isCamOn !== undefined ? !payload.isCamOn : prev[senderIdentity].isCamOff,
                    isMicMuted: payload.isMicOn !== undefined ? !payload.isMicOn : prev[senderIdentity].isMicMuted
                  }
                };
              });
            }
          } catch (e) {
            console.warn('Error processing RTC_OFFER from:', senderIdentity, e);
          }
        }
        break;
      }

      case 'RTC_ANSWER': {
        if (senderIdentity && signalData) {
          try {
            const pc = peerConnections.current[senderIdentity];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(signalData));
              // Drain queued ICE candidates
              if (iceCandidateQueues.current[senderIdentity]) {
                for (const cand of iceCandidateQueues.current[senderIdentity]) {
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
                }
                iceCandidateQueues.current[senderIdentity] = [];
              }
            }

            if (payload) {
              setPeers((prev) => {
                if (!prev[senderIdentity]) return prev;
                return {
                  ...prev,
                  [senderIdentity]: {
                    ...prev[senderIdentity],
                    isCamOff: payload.isCamOn !== undefined ? !payload.isCamOn : prev[senderIdentity].isCamOff,
                    isMicMuted: payload.isMicOn !== undefined ? !payload.isMicOn : prev[senderIdentity].isMicMuted
                  }
                };
              });
            }
          } catch (e) {
            console.warn('Error processing RTC_ANSWER from:', senderIdentity, e);
          }
        }
        break;
      }

      case 'RTC_ICE': {
        if (senderIdentity && signalData) {
          try {
            const pc = peerConnections.current[senderIdentity];
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(signalData)).catch(console.warn);
            } else {
              if (!iceCandidateQueues.current[senderIdentity]) {
                iceCandidateQueues.current[senderIdentity] = [];
              }
              iceCandidateQueues.current[senderIdentity].push(signalData);
            }
          } catch (e) {
            console.warn('Error processing RTC_ICE from:', senderIdentity, e);
          }
        }
        break;
      }

      case 'MEDIA_STATE': {
        const peerId = senderIdentity;
        if (payload) {
          setPeers((prev) => {
            if (!prev[peerId]) return prev;
            return {
              ...prev,
              [peerId]: {
                ...prev[peerId],
                isCamOff: payload.isCamOn !== undefined ? !payload.isCamOn : prev[peerId].isCamOff,
                isMicMuted: payload.isMicOn !== undefined ? !payload.isMicOn : prev[peerId].isMicMuted
              }
            };
          });
        }
        break;
      }

      case 'PEER_LEFT': {
        const leftId = data.identity;
        if (peerConnections.current[leftId]) {
          try {
            peerConnections.current[leftId].close();
          } catch (e) {}
          delete peerConnections.current[leftId];
        }
        delete iceCandidateQueues.current[leftId];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[leftId];
          return next;
        });
        setPeers((prev) => {
          const next = { ...prev };
          const leftName = next[leftId]?.name;
          delete next[leftId];
          if (leftName) showToast(`${leftName} left the meeting`, 'info');
          return next;
        });
        if (remoteScreenShare && remoteScreenShare.presenterId === leftId) {
          setRemoteScreenShare(null);
          setRemoteScreenStream(null);
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        if (message) {
          setMessages((prev) => {
            // Avoid duplicate message if already added locally
            if (
              prev.some(
                (m) =>
                  (m._id && message._id && m._id.toString() === message._id.toString()) ||
                  (m.senderId === message.senderId &&
                    m.text === message.text &&
                    Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 3000)
              )
            ) {
              return prev;
            }
            return [...prev, message];
          });
          if (activeDrawer !== 'chat') {
            setUnreadChatCount((prev) => prev + 1);
          }
        }
        break;
      }

      case 'MUTE_ALL': {
        if (!isHost) {
          // Mute student microphone
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => {
              t.enabled = false;
            });
          }
          setIsMicOn(false);
          sendSignal('MEDIA_STATE', null, { isCamOn: isCamOnRef.current, isMicOn: false });
          showToast(`The host (${senderName}) muted all participants`, 'error');
        }
        break;
      }

      case 'MUTE_USER': {
        if (data.targetIdentity === currentUserId) {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => {
              t.enabled = false;
            });
          }
          setIsMicOn(false);
          sendSignal('MEDIA_STATE', null, { isCamOn: isCamOnRef.current, isMicOn: false });
          showToast('You were muted by the host', 'error');
        }
        break;
      }

      case 'KICK_USER': {
        if (data.targetIdentity === currentUserId) {
          showToast('You were removed from the meeting by the host', 'error');
          setTimeout(() => {
            handleLeave();
          }, 1000);
        }
        break;
      }

      case 'CAM_REQUEST': {
        if (data.targetIdentity === currentUserId) {
          setCamRequestModal({
            isOpen: true,
            senderIdentity,
            senderName
          });
        }
        break;
      }

      case 'CAM_ALLOWED': {
        showToast(`${payload?.studentName || senderName} accepted camera request!`, 'success');
        break;
      }

      case 'CAM_DENIED': {
        showToast(`${payload?.studentName || senderName} declined camera request.`, 'error');
        break;
      }

      case 'SCREEN_SHARE_START': {
        setRemoteScreenShare({
          presenterId: senderIdentity,
          presenterName: senderName,
          streamId: payload?.streamId
        });
        showToast(`${senderName} started sharing their screen`, 'info');
        break;
      }

      case 'SCREEN_SHARE_STOP': {
        setRemoteScreenShare(null);
        setRemoteScreenStream(null);
        showToast(`${senderName} stopped screen sharing`, 'info');
        break;
      }

      case 'MEETING_ENDED': {
        showToast('The host has ended this meeting. Chat has been deleted.', 'error');
        setTimeout(() => {
          handleLeave();
        }, 1200);
        break;
      }

      default:
        break;
    }
  };

  // 5. Media Toggle Actions
  const toggleCamera = async () => {
    const nextState = !isCamOn;
    isCamOnRef.current = nextState;

    if (nextState) {
      // Turning camera ON
      let videoTrack = localStreamRef.current?.getVideoTracks()[0];
      const isSynthetic =
        !videoTrack ||
        videoTrack._isSynthetic ||
        videoTrack.label?.toLowerCase().includes('canvas') ||
        videoTrack.readyState !== 'live';

      if (isSynthetic) {
        try {
          const userCamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          const newVideoTrack = userCamStream.getVideoTracks()[0];
          if (newVideoTrack) {
            newVideoTrack.enabled = true;
            if (videoTrack) {
              try {
                localStreamRef.current.removeTrack(videoTrack);
                videoTrack.stop();
              } catch (e) {}
            }
            localStreamRef.current.addTrack(newVideoTrack);
            videoTrack = newVideoTrack;
            const freshLocalStream = new MediaStream(localStreamRef.current.getTracks());
            localStreamRef.current = freshLocalStream;
            setLocalStream(freshLocalStream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = freshLocalStream;
              localVideoRef.current.play().catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Physical camera unavailable (activating live stream):', err.message);
          if (videoTrack) {
            videoTrack.enabled = true;
          }
          showToast('Live Camera Stream activated', 'info');
        }
      } else {
        videoTrack.enabled = true;
      }

      // Propagate active video track to all active peer connections via replaceTrack
      if (videoTrack) {
        for (const [peerId, pc] of Object.entries(peerConnections.current)) {
          const senders = pc.getSenders();
          const vSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (vSender) {
            await vSender.replaceTrack(videoTrack).catch(console.warn);
          } else {
            try {
              pc.addTrack(videoTrack, localStreamRef.current);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal('RTC_OFFER', peerId, { isCamOn: true, isMicOn: isMicOnRef.current }, offer);
            } catch (e) {}
          }
        }
      }

      setIsCamOn(true);
      sendSignal('MEDIA_STATE', null, { isCamOn: true, isMicOn: isMicOnRef.current });
      showToast('Camera turned on', 'success');
    } else {
      // Turning camera OFF
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsCamOn(false);
      sendSignal('MEDIA_STATE', null, { isCamOn: false, isMicOn: isMicOnRef.current });
      showToast('Camera turned off', 'info');
    }
  };

  const toggleMic = async () => {
    const nextState = !isMicOn;
    isMicOnRef.current = nextState;

    if (nextState) {
      let audioTrack = localStreamRef.current?.getAudioTracks()[0];
      const isSynthetic =
        !audioTrack || audioTrack._isSynthetic || audioTrack.readyState !== 'live';

      if (isSynthetic) {
        try {
          const userMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const newAudioTrack = userMicStream.getAudioTracks()[0];
          if (newAudioTrack) {
            newAudioTrack.enabled = true;
            if (audioTrack) {
              try {
                localStreamRef.current.removeTrack(audioTrack);
                audioTrack.stop();
              } catch (e) {}
            }
            localStreamRef.current.addTrack(newAudioTrack);
            audioTrack = newAudioTrack;
            const freshLocalStream = new MediaStream(localStreamRef.current.getTracks());
            localStreamRef.current = freshLocalStream;
            setLocalStream(freshLocalStream);
          }
        } catch (err) {
          console.warn('Physical mic unavailable:', err.message);
          if (audioTrack) audioTrack.enabled = true;
        }
      } else {
        audioTrack.enabled = true;
      }

      if (audioTrack) {
        for (const [peerId, pc] of Object.entries(peerConnections.current)) {
          const senders = pc.getSenders();
          const aSender = senders.find((s) => s.track && s.track.kind === 'audio');
          if (aSender) {
            await aSender.replaceTrack(audioTrack).catch(console.warn);
          } else {
            try {
              pc.addTrack(audioTrack, localStreamRef.current);
            } catch (e) {}
          }
        }
      }

      setIsMicOn(true);
      sendSignal('MEDIA_STATE', null, { isCamOn: isCamOnRef.current, isMicOn: true });
      showToast('Microphone unmuted', 'success');
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsMicOn(false);
      sendSignal('MEDIA_STATE', null, { isCamOn: isCamOnRef.current, isMicOn: false });
      showToast('Microphone muted', 'info');
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      sendSignal('SCREEN_SHARE_STOP', null, { presenterId: currentUserId });

      // Remove screen track from peer connections and renegotiate
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        const senders = pc.getSenders();
        const screenSender = senders.find(
          (s) =>
            s.track &&
            (s.track.label.toLowerCase().includes('screen') ||
              (s.track.kind === 'video' && s.track !== localStreamRef.current?.getVideoTracks()[0]))
        );
        if (screenSender) {
          try {
            pc.removeTrack(screenSender);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal('RTC_OFFER', peerId, { isCamOn, isMicOn, isScreenShare: false }, offer);
          } catch (e) {}
        }
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const screenTrack = stream.getVideoTracks()[0];
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        if (localScreenRef.current) {
          localScreenRef.current.srcObject = stream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        sendSignal('SCREEN_SHARE_START', null, {
          presenterId: currentUserId,
          presenterName: currentUserName,
          streamId: stream.id
        });

        // Add track to each peer connection and renegotiate
        for (const [peerId, pc] of Object.entries(peerConnections.current)) {
          try {
            pc.addTrack(screenTrack, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal('RTC_OFFER', peerId, { isCamOn, isMicOn, isScreenShare: true }, offer);
          } catch (e) {
            console.warn('Renegotiation offer error for screen share:', e);
          }
        }
      } catch (err) {
        console.warn('Screen share canceled or denied:', err.message);
      }
    }
  };

  // Update screen video element when local stream changes
  useEffect(() => {
    if (localScreenRef.current && screenStream) {
      localScreenRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Update remote screen video element when remote screen stream arrives
  useEffect(() => {
    if (remoteScreenRef.current && remoteScreenStream) {
      remoteScreenRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  // 6. Host Actions
  const handleHostMuteAll = () => {
    sendSignal('MUTE_ALL');
    showToast('Muted all participants', 'success');
  };

  const handleHostMuteParticipant = (peerId, peerName) => {
    sendSignal('MUTE_USER', peerId);
    showToast(`Muted ${peerName}`, 'info');
  };

  const handleHostKickParticipant = (peerId, peerName) => {
    if (window.confirm(`Are you sure you want to remove ${peerName} from this meeting?`)) {
      sendSignal('KICK_USER', peerId);
      setPeers((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      showToast(`Removed ${peerName} from meeting`, 'info');
    }
  };

  const handleHostRequestCam = (peerId, peerName) => {
    sendSignal('CAM_REQUEST', peerId);
    showToast(`Requested ${peerName} to turn on camera`, 'info');
  };

  const handleEndMeetingForAll = async () => {
    try {
      setShowEndConfirm(false);
      await endMeeting(roomCode);
      showToast('Meeting ended and chat cleared successfully', 'success');
      setTimeout(() => {
        handleLeave();
      }, 500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end meeting');
    }
  };

  // 7. Student Cam Request Responses
  const handleAllowCamera = async () => {
    setCamRequestModal({ isOpen: false, senderIdentity: '', senderName: '' });
    if (!isCamOn) {
      await toggleCamera();
    }
    sendSignal('CAM_ALLOWED', camRequestModal.senderIdentity, { studentName: currentUserName });
    showToast('Camera enabled', 'success');
  };

  const handleDenyCamera = () => {
    sendSignal('CAM_DENIED', camRequestModal.senderIdentity, { studentName: currentUserName });
    setCamRequestModal({ isOpen: false, senderIdentity: '', senderName: '' });
  };

  // 8. Chat Submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const textToSend = messageInput.trim();
    setMessageInput('');

    try {
      const res = await sendMeetingMessage(roomCode, textToSend);
      if (res.success && res.message) {
        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                (m._id && res.message._id && m._id.toString() === res.message._id.toString()) ||
                (m.senderId === res.message.senderId &&
                  m.text === res.message.text &&
                  Math.abs(new Date(m.timestamp) - new Date(res.message.timestamp)) < 3000)
            )
          ) {
            return prev;
          }
          return [...prev, res.message];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message', 'error');
    }
  };

  // Copy helpers
  const copyMeetingCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    showToast(`Meeting Code "${roomCode}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/?meeting=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('Meeting share link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLeave = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    Object.values(peerConnections.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    peerConnections.current = {};
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (onLeave) onLeave();
  };

  const peerList = Object.values(peers);
  const totalParticipantCount = peerList.length + 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      {/* Top Meeting Header */}
      <header className="border-b border-white/10 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Video size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-none">
                {meetingTitle || 'Live Online Meeting'}
              </h2>
              {isHost && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black uppercase flex items-center gap-1">
                  <Crown size={10} />
                  <span>Host</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {roomCode}
              </span>
              <button
                onClick={copyMeetingCode}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                title="Copy Meeting Code"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
              </button>
              <button
                onClick={copyMeetingLink}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/20 transition-colors"
                title="Copy Shareable Link"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Sparkles size={12} />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Participant count */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              activeDrawer === 'participants'
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users size={14} className="text-cyan-400" />
            <span className="font-bold">{totalParticipantCount}</span>
            <span className="hidden md:inline text-slate-400">Attendees</span>
          </button>

          {/* Host Mute All Button */}
          {isHost && (
            <button
              onClick={handleHostMuteAll}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors text-xs font-bold"
              title="Mute All Attendees"
            >
              <VolumeX size={14} />
              <span>Mute All</span>
            </button>
          )}

          {/* Host End Meeting for All */}
          {isHost ? (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/25"
              title="End Meeting For All Participants"
            >
              <PhoneOff size={14} />
              <span className="hidden sm:inline">End for All</span>
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-rose-300 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <PhoneOff size={14} />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </header>

      {/* Real-time Notification Banner */}
      {notification.text && (
        <div
          className={`mx-6 mt-3 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn z-20 ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 size={16} />}
          {notification.type === 'error' && <XCircle size={16} />}
          {notification.type === 'info' && <Sparkles size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Workspace Area (Spotlight & Video Grid) */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {/* SPOTLIGHT STAGE: Screen Share Active */}
          {(isScreenSharing || remoteScreenShare) && (
            <div className="w-full bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-3 flex flex-col gap-2 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-300 border-b border-white/10">
                <span className="font-bold flex items-center gap-2 text-cyan-400">
                  <Monitor size={14} className="animate-pulse" />
                  <span>
                    {isScreenSharing
                      ? 'You are sharing your screen'
                      : `${remoteScreenShare?.presenterName} is presenting`}
                  </span>
                </span>
                {isScreenSharing && (
                  <button
                    onClick={toggleScreenShare}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <MonitorOff size={12} />
                    <span>Stop Sharing</span>
                  </button>
                )}
              </div>

              <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                {isScreenSharing ? (
                  <video
                    ref={localScreenRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={remoteScreenRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          )}

          {/* PARTICIPANT VIDEO GRID */}
          <div
            className={`grid gap-4 flex-1 auto-rows-fr ${
              isScreenSharing || remoteScreenShare
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-h-56 overflow-y-auto'
                : totalParticipantCount === 1
                ? 'grid-cols-1 max-w-3xl mx-auto w-full'
                : totalParticipantCount === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : totalParticipantCount <= 4
                ? 'grid-cols-1 sm:grid-cols-2'
                : totalParticipantCount <= 9
                ? 'grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {/* Local Tile (You) */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center group shadow-xl min-h-[220px]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${
                  isCamOn ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              />

              {!isCamOn && (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-10 z-0">
                  <div className="w-16 h-16 rounded-full bg-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl font-black uppercase shadow-lg">
                    {currentUserName[0] || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Camera Off</span>
                </div>
              )}

              {/* Local Tile Badge / Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5 truncate max-w-[150px]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{currentUserName} (You)</span>
                  {isHost && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[9px] font-extrabold uppercase">
                      Host
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`p-1 rounded ${
                      isMicOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isMicOn ? <Mic size={12} /> : <MicOff size={12} />}
                  </span>
                  <span
                    className={`p-1 rounded ${
                      isCamOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCamOn ? <Video size={12} /> : <VideoOff size={12} />}
                  </span>
                </div>
              </div>
            </div>

            {/* Remote Peer Tiles */}
            {peerList.map((peer) => (
              <RemoteVideoTile
                key={peer.identity}
                peer={peer}
                stream={remoteStreams[peer.identity]}
                isHost={isHost}
                onRequestCam={handleHostRequestCam}
                onMute={handleHostMuteParticipant}
                onKick={handleHostKickParticipant}
              />
            ))}
          </div>
        </main>

        {/* SIDEBAR: In-Meeting Chat Drawer */}
        {activeDrawer === 'chat' && (
          <aside className="w-80 sm:w-96 border-l border-white/10 bg-slate-900 flex flex-col h-full z-30 shadow-2xl animate-fadeIn">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white">In-Meeting Chat</h3>
              </div>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-[11px] text-slate-400 text-center leading-relaxed">
                Messages sent here persist for this meeting session. They are automatically cleared when the host ends the meeting.
              </div>

              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-2">
                  <MessageSquare size={28} className="text-slate-600" />
                  <span className="text-xs">No messages yet. Say hello!</span>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;
                  const isMsgHost = msg.senderRole === 'teacher';
                  const timeFormatted = msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                        <span className="font-bold text-slate-300">{isMine ? 'You' : msg.senderName}</span>
                        {isMsgHost && (
                          <span className="px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[8px] font-black uppercase">
                            Host
                          </span>
                        )}
                        <span>•</span>
                        <span>{timeFormatted}</span>
                      </div>

                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                          isMine
                            ? 'bg-cyan-600 text-white rounded-tr-sm'
                            : isMsgHost
                            ? 'bg-purple-950/80 border border-purple-500/30 text-purple-100 rounded-tl-sm'
                            : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-950/80 flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Send a message to everyone..."
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </form>
          </aside>
        )}

        {/* SIDEBAR: Participants Drawer */}
        {activeDrawer === 'participants' && (
          <aside className="w-80 sm:w-96 border-l border-white/10 bg-slate-900 flex flex-col h-full z-30 shadow-2xl animate-fadeIn">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white">
                  Participants ({totalParticipantCount})
                </h3>
              </div>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Host Quick Controls */}
            {isHost && (
              <div className="p-3 border-b border-white/10 bg-slate-950/40 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Host Management</span>
                <button
                  onClick={handleHostMuteAll}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <VolumeX size={13} />
                  <span>Mute All</span>
                </button>
              </div>
            )}

            {/* Participants List */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
              {/* Local Participant Entry */}
              <div className="p-3 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs uppercase">
                    {currentUserName[0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{currentUserName} (You)</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {isHost ? 'Host / Instructor' : 'Student'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded ${isMicOn ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                  </span>
                  <span className={`p-1 rounded ${isCamOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
                  </span>
                </div>
              </div>

              {/* Remote Participants */}
              {peerList.map((peer) => {
                const peerIsHost = peer.role === 'teacher';
                return (
                  <div
                    key={peer.identity}
                    className="p-3 rounded-xl bg-slate-950/60 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                          peerIsHost
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {peer.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{peer.name}</span>
                          {peerIsHost && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[9px] font-black uppercase">
                              Host
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{peer.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isHost && !peerIsHost && (
                        <>
                          <button
                            onClick={() => handleHostRequestCam(peer.identity, peer.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-slate-400 hover:text-purple-300 transition-colors"
                            title="Request Camera"
                          >
                            <Camera size={13} />
                          </button>
                          <button
                            onClick={() => handleHostMuteParticipant(peer.identity, peer.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 transition-colors"
                            title="Mute Participant"
                          >
                            <VolumeX size={13} />
                          </button>
                          <button
                            onClick={() => handleHostKickParticipant(peer.identity, peer.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Remove Participant"
                          >
                            <UserX size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Floating Control Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl border border-white/15 px-6 py-3 rounded-full flex items-center gap-3 sm:gap-4 shadow-2xl">
        {/* Microphone Toggle */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full font-bold transition-all ${
            isMicOn
              ? 'bg-slate-800 border border-white/15 text-emerald-400 hover:bg-slate-700 shadow-md'
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
          }`}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full font-bold transition-all ${
            isCamOn
              ? 'bg-slate-800 border border-white/15 text-cyan-400 hover:bg-slate-700 shadow-md'
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
          }`}
          title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full font-bold transition-all ${
            isScreenSharing
              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 border border-white/15 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>

        {/* Chat Drawer Toggle */}
        <button
          onClick={() => {
            setActiveDrawer(activeDrawer === 'chat' ? null : 'chat');
            setUnreadChatCount(0);
          }}
          className={`p-3 rounded-full font-bold relative transition-all ${
            activeDrawer === 'chat'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 border border-white/15 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="In-Meeting Chat"
        >
          <MessageSquare size={20} />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-slate-900 animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Participants Drawer Toggle */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')}
          className={`p-3 rounded-full font-bold transition-all ${
            activeDrawer === 'participants'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 border border-white/15 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="View Participants"
        >
          <Users size={20} />
        </button>

        <div className="w-px h-6 bg-white/10" />

        {/* Disconnect / End Button */}
        {isHost ? (
          <button
            onClick={() => setShowEndConfirm(true)}
            className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
            title="End Meeting for All"
          >
            <PhoneOff size={20} />
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="p-3 rounded-full bg-slate-800 hover:bg-rose-600/80 text-rose-300 hover:text-white border border-rose-500/30 transition-all shadow-lg"
            title="Leave Meeting"
          >
            <PhoneOff size={20} />
          </button>
        )}
      </div>

      {/* HOST END MEETING CONFIRMATION MODAL */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={32} />
            </div>

            <h3 className="text-xl font-black text-white">End Meeting for All?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              As the teacher and host, ending the meeting will disconnect all participants and delete the in-meeting chat. You can start a new meeting for this course anytime!
            </p>

            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleEndMeetingForAll}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors shadow-lg shadow-rose-600/20"
              >
                End for Everyone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT CAMERA REQUEST MODAL */}
      {camRequestModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl relative animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Camera size={32} />
            </div>

            <h3 className="text-xl font-black text-white">Camera Request</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Your instructor <strong className="text-cyan-300">{camRequestModal.senderName}</strong> has requested your camera to be enabled for this live classroom session.
            </p>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handleDenyCamera}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle size={16} />
                <span>Deny</span>
              </button>

              <button
                onClick={handleAllowCamera}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <CheckCircle2 size={16} />
                <span>Allow</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
