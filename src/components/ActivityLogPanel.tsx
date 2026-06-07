import React, { useState, useEffect, useRef } from "react";
import { Activity, ShieldCheck, ShieldAlert, Trash2, Download, Terminal } from "lucide-react";
import { LogEntry } from "../types";

interface ActivityLogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export default function ActivityLogPanel({ logs, onClearLogs }: ActivityLogPanelProps) {
  const [filter, setFilter] = useState<"ALL" | "MQTT" | "VOICE" | "RELAY" | "SYSTEM">("ALL");
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic as logs stream in
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    return log.source === filter;
  });

  const getSourceBadgeColor = (source: LogEntry["source"]) => {
    switch (source) {
      case "MQTT":
        return "bg-sky-950/40 text-sky-400 border-sky-800/30";
      case "VOICE":
        return "bg-purple-950/40 text-purple-400 border-purple-800/30";
      case "RELAY":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-800/30";
      case "SYSTEM":
        return "bg-amber-950/40 text-amber-400 border-amber-800/30";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  const getLogTextColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-emerald-400 font-bold";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-rose-400 font-bold animate-pulse";
      default:
        return "text-neutral-200";
    }
  };

  const handleDownloadLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.source}] (${l.type.toUpperCase()}) ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lumina_mqtt_log_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="activity-log-card" className="bg-white border border-[#404e3b]/15 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#e2e8e1]">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-[#404e3b]" />
          <div>
            <h3 className="text-sm font-bold text-[#2d362a] uppercase tracking-wider font-mono">
              Log Aktivitas & Konsol
            </h3>
            <p className="text-[11px] text-[#2d362a]/60">
              Sinkronisasi pesan real-time dan respon trigger perintah
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-export-log-text"
            onClick={handleDownloadLogs}
            title="Download Logs"
            className="p-1.5 rounded bg-[#f2f4f1] border border-[#cbd5e1] text-[#2d362a] hover:bg-neutral-200 cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            id="btn-clear-log-text"
            onClick={onClearLogs}
            title="Clear Logs"
            className="p-1.5 rounded bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Selector tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(["ALL", "MQTT", "VOICE", "RELAY", "SYSTEM"] as const).map((source) => (
          <button
            key={source}
            id={`log-filter-tab-${source}`}
            onClick={() => setFilter(source)}
            className={`px-3 py-1 text-[10px] font-mono tracking-wider font-extrabold rounded border uppercase transition-all cursor-pointer ${
              filter === source
                ? "bg-[#404e3b] text-white border-[#2d362a]"
                : "bg-[#f2f4f1] text-[#2d362a]/60 border-[#cbd5e1] hover:text-[#2d362a]"
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      {/* Logging output screen console */}
      <div className="bg-[#181d17] border border-[#2d362a]/25 rounded-xl p-4 font-mono text-xs h-[180px] overflow-y-auto space-y-2 select-text shadow-inner">
        {filteredLogs.length === 0 ? (
          <p className="text-neutral-500 italic text-center pt-16">
            Belum ada baris log untuk filter [{filter}]
          </p>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              id={`log-row-${log.id}`}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-1 border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              {/* Timestamp */}
              <span className="text-[10px] text-[#8ea089] shrink-0 select-none">
                [{log.timestamp}]
              </span>

              {/* Source Badge */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider border shrink-0 select-none ${getSourceBadgeColor(log.source)}`}>
                {log.source}
              </span>

              {/* Message text */}
              <span className={`leading-relaxed text-[11px] ${getLogTextColor(log.type)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Decorative summary footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono font-bold uppercase pt-1">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#404e3b]" />
          Enkripsi Websocket Aktif
        </span>
        <span>Total Log: {logs.length} Baris</span>
      </div>
    </div>
  );
}
