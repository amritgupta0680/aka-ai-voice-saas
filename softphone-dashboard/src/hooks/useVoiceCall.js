import { useState, useRef, useCallback } from "react";
import { WS_BASE_URL } from "../config/api";

export function useVoiceCall(tenantId = "demo-restaurant-101") {
  const [callStatus, setCallStatus] = useState("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAgentReplying, setIsAgentReplying] = useState(false);
  const [transcripts, setTranscripts] = useState([]);

  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isCallActiveRef = useRef(false);
  const isAgentSpeakingRef = useRef(false);

  const restartListening = useCallback(() => {
    if (!isCallActiveRef.current || isAgentSpeakingRef.current) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  }, []);

  const playBufferedAudio = useCallback(() => {
    if (audioChunksRef.current.length === 0) {
      isAgentSpeakingRef.current = false;
      setIsAgentReplying(false);
      restartListening();
      return;
    }

    isAgentSpeakingRef.current = true;
    setIsAgentReplying(true);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const combinedBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
    audioChunksRef.current = [];

    const url = URL.createObjectURL(combinedBlob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      isAgentSpeakingRef.current = false;
      setIsAgentReplying(false);
      setTimeout(restartListening, 400);
    };

    audio.play().catch(() => {
      isAgentSpeakingRef.current = false;
      setIsAgentReplying(false);
      restartListening();
    });
  }, [restartListening]);

  const sendUserSpeech = (text) => {
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setTranscripts((prev) => [...prev, { sender: "user", text }]);
    wsRef.current.send(JSON.stringify({ type: "user_speech", transcript: text }));
  };

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsSpeaking(true);
    recognition.onend = () => {
      setIsSpeaking(false);
      if (isCallActiveRef.current && !isAgentSpeakingRef.current) {
        setTimeout(restartListening, 300);
      }
    };
    recognition.onresult = (event) => {
      if (isAgentSpeakingRef.current) return;
      const text = event.results[0][0].transcript.trim();
      if (text) sendUserSpeech(text);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}
  }, [restartListening]);

  const startCall = () => {
    setTranscripts([]);
    setCallStatus("connecting");
    isCallActiveRef.current = true;
    isAgentSpeakingRef.current = false;
    audioChunksRef.current = [];

    const connectionUrl = `${WS_BASE_URL}/ws/call?tenant_id=${tenantId}`;
    const ws = new WebSocket(connectionUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      setCallStatus("connected");
      startSpeechRecognition();
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        audioChunksRef.current.push(event.data);
      } else {
        const msg = JSON.parse(event.data);
        if (msg.type === "agent_start") {
          isAgentSpeakingRef.current = true;
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
          }
          audioChunksRef.current = [];
          setTranscripts((prev) => [...prev, { sender: "agent", text: "" }]);
        } else if (msg.type === "text_delta") {
          setTranscripts((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.sender === "agent") {
              last.text = msg.content;
            }
            return updated;
          });
        } else if (msg.type === "agent_end") {
          playBufferedAudio();
        }
      }
    };

    ws.onclose = () => {
      isCallActiveRef.current = false;
      isAgentSpeakingRef.current = false;
      setCallStatus("disconnected");
    };
  };

  const endCall = () => {
    isCallActiveRef.current = false;
    isAgentSpeakingRef.current = false;
    if (wsRef.current) wsRef.current.close();
    if (recognitionRef.current) recognitionRef.current.stop();
    setCallStatus("disconnected");
    setIsSpeaking(false);
    setIsAgentReplying(false);
  };

  return {
    callStatus,
    isSpeaking,
    isAgentReplying,
    transcripts,
    startCall,
    endCall,
    sendUserSpeech
  };
}