import React, { useState, useEffect } from "react";
import { LayoutGrid, Map, Lightbulb, Zap, Clock, Power, ShieldAlert } from "lucide-react";
import { RelayState } from "../types";

interface RelayControlsProps {
  relays: RelayState[];
  onToggleRelay: (id: number) => void;
  isConnected: boolean;
}

export default function RelayControls({
  relays,
  onToggleRelay,
  isConnected,
}: RelayControlsProps) {
  const [activeVariation, setActiveVariation] = useState<1 | 2>(1);
  const [customTimers, setCustomTimers] = useState<{ [key: number]: number }>({});
  const [activeTimers, setActiveTimers] = useState<{ [key: number]: any }>({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(activeTimers).forEach((t: any) => {
        if (t) clearTimeout(t);
      });
    };
  }, [activeTimers]);

  const handleQuickTimer = (id: number, minutes: number) => {
    if (activeTimers[id]) {
      clearTimeout(activeTimers[id]);
      const updated = { ...activeTimers };
      delete updated[id];
      setActiveTimers(updated);
      setCustomTimers((prev) => ({ ...prev, [id]: 0 }));
      return;
    }

    // Set toggle
    onToggleRelay(id); // Turn ON (or off if already on)
    
    setCustomTimers((prev) => ({ ...prev, [id]: minutes * 60 }));

    const timer = setTimeout(() => {
      onToggleRelay(id); // Toggle back
      setCustomTimers((prev) => ({ ...prev, [id]: 0 }));
      const updated = { ...activeTimers };
      delete updated[id];
      setActiveTimers(updated);
    }, minutes * 60 * 1000);

    setActiveTimers((prev) => ({ ...prev, [id]: timer }));
  };

  // Simulated countdown interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomTimers((prev) => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach((key) => {
          const numKey = Number(key);
          if (next[numKey] > 0) {
            next[numKey] -= 1;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div id="relay-controls-section" className="space-y-6">
      {/* Variation Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#404e3b]/15 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-[#2d362a] flex items-center gap-2 uppercase tracking-tight">
            <Zap className="w-4 h-4 text-[#404e3b]" />
            Relay Control Interface Style
          </h3>
          <p className="text-[11px] text-[#2d362a]/60 mt-0.5 font-sans">
            Pilih di antara 2 variasi kontrol interaktif yang dirancang khusus:
          </p>
        </div>

        <div className="flex bg-[#f2f4f1] p-1 rounded border border-[#e2e8e1]">
          <button
            id="btn-select-var-1"
            onClick={() => setActiveVariation(1)}
            style={{ backgroundColor: activeVariation === 1 ? "#404e3b" : "transparent" }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeVariation === 1
                ? "text-white shadow-sm font-bold"
                : "text-[#2d362a]/60 hover:text-[#2d362a]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid Glass
          </button>
          <button
            id="btn-select-var-2"
            onClick={() => setActiveVariation(2)}
            style={{ backgroundColor: activeVariation === 2 ? "#404e3b" : "transparent" }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeVariation === 2
                ? "text-white shadow-sm font-bold"
                : "text-[#2d362a]/60 hover:text-[#2d362a]"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Peta Skematik
          </button>
        </div>
      </div>

      {/* Warning if disconnected */}
      {!isConnected && (
        <div id="disconnected-warning-banner" className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl flex items-center gap-3 text-xs text-amber-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block text-amber-950 uppercase tracking-wide text-[10px] mb-0.5">⚠️ Mode Simulasi Aktif:</span>
            Anda belum terhubung ke broker MQTT. Anda tetap bisa menekan tombol untuk melihat visualisasi, fungsi suara, dan pembaruan log aktivitas. Hubungkan broker di atas untuk melakukan kontrol nyata!
          </div>
        </div>
      )}

      {/* Variation 1: Grid Glass Cards */}
      {activeVariation === 1 && (
        <div id="relay-variation-1-panel" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {relays.map((relay) => {
            const hasTimer = !!customTimers[relay.id];
            return (
              <div
                key={relay.id}
                id={`relay-card-${relay.id}`}
                className={`relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between min-h-[190px] shadow-sm select-none ${
                  relay.isOpen
                    ? "bg-[#ecf2eb] border-[#404e3b]/35 shadow-[0_4px_16px_rgba(64,78,59,0.06)]"
                    : "bg-white border-[#e2e8e1]"
                }`}
              >
                {/* Visual state ornament */}
                {relay.isOpen && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#404e3b] rounded-t-2xl" />
                )}

                {/* Top Header Row of individual Relay Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: relay.isOpen ? "#404e3b" : "#f2f4f1",
                        borderColor: relay.isOpen ? "#2d362a" : "#e2e8e1",
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300"
                    >
                      <Lightbulb
                        className={`w-5 h-5 transition-transform duration-300 ${
                          relay.isOpen ? "text-[#8fa886] scale-110" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2d362a] uppercase tracking-tight">
                        {relay.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-mono tracking-wide mt-0.5">
                        {relay.topic}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    id={`toggle-switch-var1-${relay.id}`}
                    onClick={() => onToggleRelay(relay.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      relay.isOpen ? "bg-[#404e3b]" : "bg-neutral-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                        relay.isOpen ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Middleware Details (Simulated Watts) */}
                <div className="my-4">
                  <div className="flex items-center justify-between text-xs text-[#2d362a] mb-1.5">
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <Zap className={`w-3.5 h-3.5 ${relay.isOpen ? "text-[#404e3b]" : "text-neutral-400"}`} />
                      {relay.isOpen ? `${relay.watts} Watt` : "0 Watt"}
                    </span>
                    {hasTimer && (
                      <span className="bg-amber-50 text-amber-900 flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        {formatTime(customTimers[relay.id])}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions box */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e2e8e1]">
                  <span className={`text-[10px] font-mono font-extrabold tracking-wider ${relay.isOpen ? "text-[#404e3b]" : "text-neutral-400"}`}>
                    {relay.isOpen ? "ACTIVE / ON" : "INACTIVE / OFF"}
                  </span>
                  
                  <button
                    id={`quick-timer-${relay.id}`}
                    onClick={() => handleQuickTimer(relay.id, 1)}
                    className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold tracking-wide transition-all uppercase cursor-pointer ${
                      hasTimer
                        ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        : "bg-[#f2f4f1] text-[#2d362a] border border-[#cbd5e1] hover:bg-neutral-200"
                    }`}
                  >
                    {hasTimer ? "BATAL" : "TIMER 1M"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Variation 2: Interactive Layout & Industrial Tactile Buttons */}
      {activeVariation === 2 && (
        <div id="relay-variation-2-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Schematic Floorplan (SVG/Visual Representation) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#404e3b]/15 flex flex-col justify-between h-[360px] relative overflow-hidden shadow-sm">
            <div>
              <h4 className="text-xs font-mono text-[#404e3b] font-bold tracking-widest uppercase mb-1">
                Visual Mimic Panel Map
              </h4>
              <p className="text-[11px] text-[#2d362a]/60">
                Peta tataruang rumah pintar. Sentuh lampu langsung pada peta untuk menyalakan/mematikan lampu.
              </p>
            </div>

            {/* Floor Plan Sketch */}
            <div className="relative w-full h-[220px] border border-[#e2e8e1] rounded-xl my-4 bg-[#f9faf9] flex items-center justify-center">
              {/* Floor dividers layout as background grids */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                {/* Room 1: Terrace/Garden */}
                <div className="border-r border-b border-[#e2e8e1] p-2 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-[#404e3b]/60 font-bold uppercase">Taman / Teras</span>
                </div>
                {/* Room 2: Living Room */}
                <div className="border-b border-[#e2e8e1] p-2 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-[#404e3b]/60 font-bold uppercase">Ruang Keluarga</span>
                </div>
                {/* Room 3: Kitchen */}
                <div className="border-r border-[#e2e8e1] p-2 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-[#404e3b]/60 font-bold uppercase">Area Dapur</span>
                </div>
                {/* Room 4: Main Bedroom */}
                <div className="p-2 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-[#404e3b]/60 font-bold uppercase">Kamar Tidur</span>
                </div>
              </div>

              {/* Hotspots corresponding to relays */}
              {/* Relay 1 Hotspot (Teras - Top-Left Room) */}
              <button
                id="hotspot-relay-1"
                onClick={() => onToggleRelay(1)}
                className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                  relays[0].isOpen
                    ? "bg-[#ecf2eb] border-[#404e3b] scale-110 shadow-[0_0_12px_rgba(64,78,59,0.3)] text-[#404e3b]"
                    : "bg-white border-[#cbd5e1] text-gray-400 hover:border-[#404e3b]"
                }`}>
                  <Lightbulb className={`w-4 h-4 ${relays[0].isOpen ? "text-[#8fa886]" : "text-gray-400"}`} />
                  {relays[0].isOpen && (
                    <span className="absolute inset-0 w-10 h-10 rounded-full border border-[#404e3b] animate-ping" />
                  )}
                </div>
                <span className="absolute mt-14 bg-[#2d362a] text-[9px] font-bold text-white px-1.5 py-0.5 rounded tracking-wider border border-[#2d362a] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-sm">
                  Relay 1 (Taman)
                </span>
              </button>

              {/* Relay 2 Hotspot (Ruang Keluarga - Top-Right Room) */}
              <button
                id="hotspot-relay-2"
                onClick={() => onToggleRelay(2)}
                className="absolute top-[25%] left-[75%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                  relays[1].isOpen
                    ? "bg-[#ecf2eb] border-[#404e3b] scale-110 shadow-[0_0_12px_rgba(64,78,59,0.3)] text-[#404e3b]"
                    : "bg-white border-[#cbd5e1] text-gray-400 hover:border-[#404e3b]"
                }`}>
                  <Lightbulb className={`w-4 h-4 ${relays[1].isOpen ? "text-[#8fa886]" : "text-gray-400"}`} />
                  {relays[1].isOpen && (
                    <span className="absolute inset-0 w-10 h-10 rounded-full border border-[#404e3b] animate-ping" />
                  )}
                </div>
                <span className="absolute mt-14 bg-[#2d362a] text-[9px] font-bold text-white px-1.5 py-0.5 rounded tracking-wider border border-[#2d362a] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-sm">
                  Relay 2 (Keluarga)
                </span>
              </button>

              {/* Relay 3 Hotspot (Dapur - Bottom-Left Room) */}
              <button
                id="hotspot-relay-3"
                onClick={() => onToggleRelay(3)}
                className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                  relays[2].isOpen
                    ? "bg-[#ecf2eb] border-[#404e3b] scale-110 shadow-[0_0_12px_rgba(64,78,59,0.3)] text-[#404e3b]"
                    : "bg-white border-[#cbd5e1] text-gray-400 hover:border-[#404e3b]"
                }`}>
                  <Lightbulb className={`w-4 h-4 ${relays[2].isOpen ? "text-[#8fa886]" : "text-gray-400"}`} />
                  {relays[2].isOpen && (
                    <span className="absolute inset-0 w-10 h-10 rounded-full border border-[#404e3b] animate-ping" />
                  )}
                </div>
                <span className="absolute mt-14 bg-[#2d362a] text-[9px] font-bold text-white px-1.5 py-0.5 rounded tracking-wider border border-[#2d362a] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-sm">
                  Relay 3 (Dapur)
                </span>
              </button>

              {/* Relay 4 Hotspot (Kamar Tidur - Bottom-Right Room) */}
              <button
                id="hotspot-relay-4"
                onClick={() => onToggleRelay(4)}
                className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                  relays[3].isOpen
                    ? "bg-[#ecf2eb] border-[#404e3b] scale-110 shadow-[0_0_12px_rgba(64,78,59,0.3)] text-[#404e3b]"
                    : "bg-white border-[#cbd5e1] text-gray-400 hover:border-[#404e3b]"
                }`}>
                  <Lightbulb className={`w-4 h-4 ${relays[3].isOpen ? "text-[#8fa886]" : "text-gray-400"}`} />
                  {relays[3].isOpen && (
                    <span className="absolute inset-0 w-10 h-10 rounded-full border border-[#404e3b] animate-ping" />
                  )}
                </div>
                <span className="absolute mt-14 bg-[#2d362a] text-[9px] font-bold text-white px-1.5 py-0.5 rounded tracking-wider border border-[#2d362a] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-sm">
                  Relay 4 (Kamar)
                </span>
              </button>
            </div>

            <div className="text-[10px] text-gray-500 font-bold tracking-wider font-mono text-center flex items-center justify-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#404e3b]/30 animate-pulse" />
              SINKRONISASI AKTIF DENGAN PAYLOAD STATS MQTT
            </div>
          </div>

          {/* Right side: Industrial Tactile Buttons */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-[#404e3b]/15 flex-1 shadow-sm">
              <h4 className="text-xs font-mono text-[#404e3b] font-bold tracking-widest uppercase mb-3">
                Tactile Switch Panel
              </h4>
              
              <div className="space-y-3">
                {relays.map((relay) => (
                  <button
                    key={relay.id}
                    id={`tactile-btn-var2-${relay.id}`}
                    onClick={() => onToggleRelay(relay.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      relay.isOpen
                        ? "bg-[#ecf2eb] border-[#404e3b]/40 shadow-xs"
                        : "bg-white border-[#e2e8e1] hover:bg-[#f9faf9]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        relay.isOpen 
                          ? "bg-[#404e3b] border-[#404e3b] shadow-xs" 
                          : "bg-neutral-100 border-neutral-300"
                      }`} />
                      <span className="text-sm font-bold text-[#2d362a] uppercase tracking-tight">{relay.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#2d362a]/70 bg-neutral-100 px-2 py-0.5 rounded border border-[#cbd5e1] uppercase">
                        {relay.isOpen ? "ON" : "OFF"}
                      </span>
                      <div className={`p-1.5 rounded-full ${
                        relay.isOpen ? "bg-[#404e3b] text-white" : "bg-[#f2f4f1] text-[#2d362a]/40"
                      }`}>
                        <Power className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Master Button Panel */}
            <div className="bg-[#f2f4f1] p-4 rounded-xl border border-[#404e3b]/15 flex items-center justify-between gap-3 text-xs shadow-sm">
              <span className="text-[#2d362a] font-bold uppercase tracking-wider text-[10px]">Aksi Master Relay:</span>
              <div className="flex gap-2">
                <button
                  id="btn-master-all-off"
                  onClick={() => {
                    relays.forEach(r => {
                      if (r.isOpen) onToggleRelay(r.id);
                    });
                  }}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3.5 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Matikan Semua
                </button>
                <button
                  id="btn-master-all-on"
                  onClick={() => {
                    relays.forEach(r => {
                      if (!r.isOpen) onToggleRelay(r.id);
                    });
                  }}
                  className="bg-[#ecf2eb] hover:bg-[#dfeada] border border-[#404e3b]/30 text-[#404e3b] px-3.5 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Nyalakan Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
