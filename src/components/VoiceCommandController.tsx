import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, HelpCircle, Sparkles, CheckCircle2 } from "lucide-react";

interface VoiceCommandControllerProps {
  onCommandReceived: (rawText: string, parsedCommand: { target: string; action: "ON" | "OFF" | "ALL_ON" | "ALL_OFF" | "UNKNOWN" }) => void;
  onLogMessage: (message: string, type: "info" | "success" | "warning" | "error", source: "VOICE" | "SYSTEM") => void;
  disabled: boolean;
}

export default function VoiceCommandController({
  onCommandReceived,
  onLogMessage,
  disabled,
}: VoiceCommandControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [parsedMsg, setParsedMsg] = useState("");
  const recognitionRef = useRef<any>(null);

  // Suggested commands list helper
  const suggestions = [
    "\"Nyalakan Lampu 1\"",
    "\"Matikan Lampu 2\"",
    "\"Hidupkan semua lampu\"",
    "\"Matikan Relay 3\"",
    "\"Padamkan semua\""
  ];

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "id-ID"; // Default Indonesian language support

      rec.onstart = () => {
        setIsListening(true);
        onLogMessage("Mendengar suara...", "info", "VOICE");
        setHeardText("");
        setParsedMsg("");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        setHeardText(transcript);
        
        onLogMessage(`Mendengar suara: "${transcript}"`, "info", "VOICE");
        
        // Parse Indonesian commands
        const text = transcript.toLowerCase();
        let action: "ON" | "OFF" | "ALL_ON" | "ALL_OFF" | "UNKNOWN" = "UNKNOWN";
        let target = "";

        // Check for "semua"
        if (
          text.includes("semua") || 
          text.includes("semua lampu") || 
          text.includes("sembarang")
        ) {
          if (text.includes("nyalakan") || text.includes("hidupkan") || text.includes("matikan tidak") || text.includes("aktifkan") || text.includes("on")) {
            action = "ALL_ON";
            target = "all";
          } else if (text.includes("matikan") || text.includes("padamkan") || text.includes("padam") || text.includes("off") || text.includes("nonaktifkan")) {
            action = "ALL_OFF";
            target = "all";
          }
        } else {
          // Check match for specific lamp index (1-4)
          let lampNum = 0;
          if (text.includes("1") || text.includes("satu")) lampNum = 1;
          else if (text.includes("2") || text.includes("dua")) lampNum = 2;
          else if (text.includes("3") || text.includes("tiga")) lampNum = 3;
          else if (text.includes("4") || text.includes("empat")) lampNum = 4;

          if (lampNum > 0) {
            target = lampNum.toString();
            if (text.includes("nyalakan") || text.includes("hidupkan") || text.includes("aktifkan") || text.includes("on")) {
              action = "ON";
            } else if (text.includes("matikan") || text.includes("padamkan") || text.includes("nonaktifkan") || text.includes("off")) {
              action = "OFF";
            }
          }
        }

        // Handle parsing log dispatch & display
        if (action !== "UNKNOWN") {
          let actionLabel = action === "ON" || action === "ALL_ON" ? "MENYALAKAN" : "MEMATIKAN";
          let targetLabel = target === "all" ? "Semua Lampu" : `Lampu ${target}`;
          setParsedMsg(`Perintah dikenali: ${actionLabel} ${targetLabel}`);
          onLogMessage(`Berhasil menganalisis perintah: "${actionLabel} ${targetLabel}"`, "success", "VOICE");
        } else {
          setParsedMsg("Perintah tidak dikenali. Coba ucapkan 'Nyalakan Lampu 1'");
          onLogMessage(`Gagal mengenali perintah: "${transcript}" (Format kata kunci tidak cocok)`, "warning", "VOICE");
        }

        // Emit to parent
        onCommandReceived(transcript, { target, action });
      };

      rec.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === "no-speech") {
          onLogMessage("Mendengar suara: (Tidak ada suara terdeteksi dalam waktu tunggu)", "warning", "VOICE");
          setParsedMsg("Tidak ada suara terdeteksi. Silakan coba lagi.");
        } else if (e.error === "not-allowed") {
          onLogMessage("Mendengar suara: (Akses mikrofon ditolak oleh browser)", "error", "SYSTEM");
          setParsedMsg("Izin mikrofon diblokir. Harap periksa pengaturan peramban.");
        } else {
          onLogMessage(`Mikrofon Bermasalah: ${e.error}`, "error", "SYSTEM");
          setParsedMsg(`Terjadi gangguan suara: ${e.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      onLogMessage("Sistem Pengenalan Suara (Web Speech API) tidak didukung pada browser ini.", "warning", "SYSTEM");
    }
  }, [onCommandReceived, onLogMessage]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      onLogMessage("Voice Engine tidak tersedia. Gunakan Chrome atau browser modern.", "error", "SYSTEM");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Recognition might already be starting/started or cleaning up
        console.error(e);
      }
    }
  };

  return (
    <div id="voice-control-card" className="bg-white border border-[#404e3b]/15 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
        {/* Helper Instructions and Title */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#404e3b]" />
            <h3 className="text-sm font-bold text-[#2d362a] uppercase tracking-wider font-mono">
              Voice Command Assistant
            </h3>
          </div>
          <p className="text-xs text-[#2d362a]/70 leading-relaxed">
            Klik tombol mikrofon di samping, berikan izin akses mikrofon, lalu ucapkan perintah suara dalam bahasa Indonesia untuk mengendalikan lampu secara otomatis.
          </p>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {suggestions.map((suggestion, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-[#f2f4f1] border border-[#e2e8e1] text-[#2d362a] px-2.5 py-1 rounded font-mono font-bold hover:bg-[#404e3b] hover:text-white transition-all cursor-help"
                title="Klik mikrofon lalu tanyakan ini"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Voice Trigger Sphere & Wave */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <button
            id="btn-voice-trigger"
            onClick={toggleListen}
            disabled={disabled}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border transition-all duration-300 relative cursor-pointer ${
              isListening
                ? "bg-red-50 border-red-300 text-red-600 shadow-[0_0_12px_rgba(220,38,38,0.2)] animate-pulse"
                : "bg-[#ecf2eb] border-[#404e3b]/20 text-[#404e3b] hover:bg-[#dfeada]"
            } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6" />
            )}

            {/* Listening Wave Effect */}
            {isListening && (
              <span className="absolute inset-x-0 bottom-0 top-0 rounded-full border-2 border-red-500 animate-ping opacity-40" />
            )}
          </button>

          <span className="text-[10px] font-bold text-center font-mono uppercase tracking-wider text-[#404e3b]">
            {isListening ? "Mendengar..." : "Klik untuk Bicara"}
          </span>
        </div>
      </div>

      {/* Visualizer and transcripts */}
      {(heardText || isListening || parsedMsg) && (
        <div id="voice-recognition-box" className="mt-5 bg-[#f9faf9] border border-[#cbd5e1] rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#404e3b] font-mono tracking-wider uppercase flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-neutral-400"}`} />
              Sinyal Transkrip Suara
            </span>
            {isListening && (
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-full bg-[#404e3b] rounded animate-[pulse_0.4s_infinite]" />
                <span className="w-0.5 h-[60%] bg-[#404e3b] rounded animate-[pulse_0.3s_infinite_0.1s]" />
                <span className="w-0.5 h-[80%] bg-[#404e3b] rounded animate-[pulse_0.5s_infinite_0.2s]" />
                <span className="w-0.5 h-[40%] bg-[#404e3b] rounded animate-[pulse_0.2s_infinite_0.3s]" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            {isListening && !heardText && (
              <p className="text-xs text-neutral-400 italic">
                Ucapkan perintah sekarang... (Sistem mendengarkan)
              </p>
            )}

            {heardText && (
              <div className="text-sm font-bold text-[#2d362a] bg-white p-2.5 rounded border border-[#e2e8e1]">
                <span className="text-[10px] text-gray-400 block font-mono font-bold uppercase tracking-wider">Hasil Suara:</span>
                "{heardText}"
              </div>
            )}

            {parsedMsg && (
              <div className="text-xs text-[#2d362a] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#404e3b]" />
                <span>{parsedMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
