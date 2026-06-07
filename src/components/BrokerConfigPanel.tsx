import React, { useState } from "react";
import { Settings, HelpCircle, Eye, EyeOff, Save, CheckCircle2 } from "lucide-react";
import { BrokerConfig } from "../types";

interface BrokerConfigPanelProps {
  config: BrokerConfig;
  onSaveConfig: (updated: BrokerConfig) => void;
  isConnected: boolean;
}

export default function BrokerConfigPanel({
  config,
  onSaveConfig,
  isConnected,
}: BrokerConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [server, setServer] = useState(config.server);
  const [port, setPort] = useState(config.port);
  const [protocol, setProtocol] = useState(config.protocol);
  const [clientId, setClientId] = useState(config.clientId);
  const [user, setUser] = useState(config.user);
  const [pass, setPass] = useState(config.pass);
  const [topicPrefix, setTopicPrefix] = useState(config.topicPrefix);
  const [showPass, setShowPass] = useState(false);
  const [isSavedNotify, setIsSavedNotify] = useState(false);
  const [useSeparateWebClientId, setUseSeparateWebClientId] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If separate Web Client ID is toggled, ensure we don't kick off the ESP32
    const finalClientId = useSeparateWebClientId
      ? clientId.endsWith("_web") ? clientId : `${clientId}_web`
      : clientId;

    onSaveConfig({
      ...config,
      server,
      port,
      protocol,
      clientId: finalClientId,
      user,
      pass,
      topicPrefix,
    });

    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2500);
  };

  return (
    <div id="broker-config-card" className="bg-white border border-[#404e3b]/15 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Header */}
      <button
        id="btn-toggle-config-panel"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white border-b border-[#404e3b]/10 hover:bg-[#f9faf9] transition-colors duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#404e3b]" />
          <div className="text-left">
            <h2 className="text-sm font-bold text-[#2d362a] tracking-tight uppercase">
              Parameter Settings & Credentials
            </h2>
            <p className="text-[11px] text-[#2d362a]/60 font-sans mt-0.5">
              Hubungkan dashboard web ini dengan kredensial MyQTTHub ESP32 Anda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="text-[9px] bg-[#404e3b]/10 text-[#404e3b] px-2.5 py-0.5 rounded-full border border-[#404e3b]/20 font-bold font-mono animate-pulse">
              ACTIVE
            </span>
          )}
          <span className="text-[#404e3b] text-xs font-bold font-mono">
            {isOpen ? "SEMBUNYIKAN ↑" : "KONFIGURASI ↓"}
          </span>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Explanation Box */}
          <div className="bg-[#f9faf9] border border-[#e2e8e1] p-3.5 rounded-lg text-xs leading-relaxed text-[#2d362a] flex gap-3">
            <HelpCircle className="w-5 h-5 text-[#404e3b] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#2d362a] block mb-1">💡 Catatan Mengenai WebSocket Browser:</strong>
              Di dalam browser web, koneksi port TCP <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-red-600 font-bold">8883</span> murni tidak diperbolehkan karena aturan keamanan. Untuk menghubungkan secara real-time, aplikasi web ini secara cerdas mengonfigurasi <span className="text-stone-900 font-bold">MQTToverWebsocket (WSS)</span>. Anda tetap menggunakan konfigurasi akun MyQTTHub Anda dan sistem akan menghubungkannya secara aman melalui SSL port <span className="font-mono text-[#404e3b] font-bold">443 / WSS</span>!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Host Server */}
            <div>
              <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                MQTT Server Host
              </label>
              <input
                id="cfg-mqtt-server"
                type="text"
                className="w-full bg-white border border-[#d1d5db] rounded px-3 py-2 text-sm text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono transition-all"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                required
              />
            </div>

            {/* Port & Protocol */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                  Port (WSS)
                </label>
                <input
                  id="cfg-mqtt-port"
                  type="number"
                  className="w-full bg-white border border-[#d1d5db] rounded px-3 py-2 text-sm text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono transition-all"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                  Protokol
                </label>
                <select
                  id="cfg-mqtt-protocol"
                  className="w-full bg-white border border-[#d1d5db] rounded px-3 py-2 text-xs text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono cursor-pointer transition-all"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as "ws" | "wss")}
                >
                  <option value="wss">WSS (Secure)</option>
                  <option value="ws">WS (Unsecured)</option>
                </select>
              </div>
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                Client ID
              </label>
              <input
                id="cfg-mqtt-clientid"
                type="text"
                className="w-full bg-white border border-[#d1d5db] rounded px-3 py-2 text-sm text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono transition-all"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
            </div>

            {/* Topic Prefix */}
            <div>
              <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                Topik Publikasi (Prefix)
              </label>
              <input
                id="cfg-mqtt-topic-prefix"
                type="text"
                placeholder="cth: rumah/relay"
                className="w-full bg-white border border-[#d1d5db] rounded px-3 py-2 text-sm text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono transition-all"
                value={topicPrefix}
                onChange={(e) => setTopicPrefix(e.target.value)}
                required
              />
            </div>

            {/* MQTT Username */}
            <div>
              <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                MQTT Username (User)
              </label>
              <input
                id="cfg-mqtt-user"
                type="text"
                className="w-full bg-white border border-[#d1d5db] rounded px-3 py-2 text-sm text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono transition-all"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>

            {/* MQTT Password */}
            <div>
              <label className="block text-xs font-bold text-[#404e3b] mb-1 font-mono uppercase tracking-wider">
                MQTT Password (Pass)
              </label>
              <div className="relative">
                <input
                  id="cfg-mqtt-pass"
                  type={showPass ? "text" : "password"}
                  className="w-full bg-white border border-[#d1d5db] rounded pl-3 pr-10 py-2 text-sm text-[#2d362a] outline-none focus:border-[#404e3b] focus:ring-1 focus:ring-[#404e3b] font-mono transition-all"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
                <button
                  id="btn-toggle-config-password"
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#404e3b]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4 border-t border-[#e2e8e1]">
            <label className="flex items-center gap-2.5 text-xs text-[#2d362a] select-none cursor-pointer">
              <input
                id="cfg-mqtt-separate-id"
                type="checkbox"
                checked={useSeparateWebClientId}
                onChange={(e) => setUseSeparateWebClientId(e.target.checked)}
                className="rounded accent-[#404e3b] w-4 h-4 cursor-pointer"
              />
              <span>Tumpuk Client ID Web (<span className="text-neutral-900 font-bold font-mono">{clientId}_web</span>) agar ESP32 tidak terputus</span>
            </label>

            <button
              id="btn-save-broker-config"
              type="submit"
              className="w-full sm:w-auto bg-[#404e3b] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded border border-[#2d362a]/20 hover:bg-[#2d362a] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              Simpan & Terapkan
            </button>
          </div>

          {isSavedNotify && (
            <div id="save-notification" className="bg-[#404e3b]/10 border border-[#404e3b]/30 px-4 py-2.5 rounded text-xs text-[#404e3b] flex items-center gap-2 transition-all">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#404e3b]" />
              Kredensial disimpan! Dashboard akan terhubung ulang secara otomatis jika koneksi aktif.
            </div>
          )}
        </form>
      )}
    </div>
  );
}
