import React from "react";
import { Wifi, WifiOff, Power, Database, Cpu } from "lucide-react";
import { BrokerType } from "../types";

interface NavbarProps {
  isConnected: boolean;
  isConnecting: boolean;
  selectedBroker: BrokerType;
  onBrokerChange: (broker: BrokerType) => void;
  onToggleConnect: () => void;
}

export default function Navbar({
  isConnected,
  isConnecting,
  selectedBroker,
  onBrokerChange,
  onToggleConnect,
}: NavbarProps) {
  return (
    <nav 
      id="app-navbar"
      className="sticky top-0 z-50 bg-[#404e3b] text-white shadow-lg px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 shadow-inner">
          <Cpu id="cpu-icon" className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight uppercase">
            Lumina Relay Control Pro
          </h1>
          <p className="text-[9px] uppercase tracking-widest opacity-70 font-semibold">
            MQTT Smart Infrastructure
          </p>
        </div>
      </div>

      {/* Control Actions / Status Bar */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 w-full md:w-auto">
        {/* Broker Selector */}
        <div className="flex flex-col">
          <label className="text-[9px] uppercase font-bold opacity-70 mb-1">Active Broker</label>
          <div className="flex items-center gap-1.5 bg-[#2d362a] border border-white/20 rounded px-2.5 py-1 text-xs">
            <Database className="w-3.5 h-3.5 text-[#8fa886]" />
            <select
              id="broker-selector"
              className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1 font-medium focus:ring-0"
              value={selectedBroker}
              onChange={(e) => onBrokerChange(e.target.value as BrokerType)}
            >
              <option value="myqtthub" className="bg-[#2d362a] text-white">
                myqtthub (node02.myqtthub.com)
              </option>
              <option value="hivemq" className="bg-[#2d362a] text-gray-400" disabled>
                HiveMQ (Inactive)
              </option>
              <option value="emqx" className="bg-[#2d362a] text-gray-400" disabled>
                EMQX (Inactive)
              </option>
            </select>
          </div>
        </div>

        {/* Dynamic Connection Badge */}
        <div 
          id="connection-badge"
          className="flex items-center space-x-2.5 px-4 py-2 bg-white/10 rounded-full border border-white/10 text-xs font-semibold"
        >
          {isConnected ? (
            <>
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse" />
              <span>CONNECTED</span>
            </>
          ) : isConnecting ? (
            <>
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
              <span>CONNECTING...</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
              <span>DISCONNECTED</span>
            </>
          )}
        </div>

        {/* Connect / Disconnect Action Button */}
        <button
          id="btn-connection-toggle"
          onClick={onToggleConnect}
          disabled={isConnecting}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors cursor-pointer ${
            isConnected
              ? "bg-red-900/40 hover:bg-red-900/60 border-red-500/30 text-red-200"
              : isConnecting
              ? "bg-white/10 border-white/20 text-white/50 cursor-not-allowed"
              : "bg-white/20 hover:bg-white/30 border-white/30 text-white"
          }`}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </nav>
  );
}
