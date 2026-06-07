import React, { useState, useEffect, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";
import Navbar from "./components/Navbar";
import BrokerConfigPanel from "./components/BrokerConfigPanel";
import RelayControls from "./components/RelayControls";
import VoiceCommandController from "./components/VoiceCommandController";
import ActivityLogPanel from "./components/ActivityLogPanel";
import { RelayState, LogEntry, BrokerConfig, BrokerType } from "./types";
import { Cpu, Terminal, Sparkles, BookOpen, ExternalLink, HelpCircle } from "lucide-react";

// Prepopulate the MyQTTHub default settings requested by user
const INITIAL_BROKER_CONFIG: BrokerConfig = {
  type: "myqtthub",
  name: "MyQTTHub Broker",
  server: "node02.myqtthub.com",
  port: 443, // Websocket secure port (typically mapping over 443/8083 instead of 8883)
  protocol: "wss",
  clientId: "esp32_client_web",
  user: "esp32",
  pass: "123",
  topicPrefix: "esp32/relay",
};

const INITIAL_RELAYS: RelayState[] = [
  { id: 1, name: "Lampu Teras", isOpen: false, topic: "esp32/relay1", payloadOn: "1", payloadOff: "0", watts: 15 },
  { id: 2, name: "Lampu Ruang Utama", isOpen: false, topic: "esp32/relay2", payloadOn: "1", payloadOff: "0", watts: 28 },
  { id: 3, name: "Lampu Area Dapur", isOpen: false, topic: "esp32/relay3", payloadOn: "1", payloadOff: "0", watts: 18 },
  { id: 4, name: "Lampu Kamar Tidur", isOpen: false, topic: "esp32/relay4", payloadOn: "1", payloadOff: "0", watts: 12 },
];

export default function App() {
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>(() => {
    const saved = localStorage.getItem("lumina_mqtt_config");
    return saved ? JSON.parse(saved) : INITIAL_BROKER_CONFIG;
  });

  const [relays, setRelays] = useState<RelayState[]>(() => {
    const saved = localStorage.getItem("lumina_relays_state");
    return saved ? JSON.parse(saved) : INITIAL_RELAYS;
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<BrokerType>("myqtthub");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const clientRef = useRef<MqttClient | null>(null);

  // Sync relays state topic with topic prefix
  useEffect(() => {
    setRelays(prev => 
      prev.map(r => ({
        ...r,
        topic: `${brokerConfig.topicPrefix}${r.id}`
      }))
    );
  }, [brokerConfig.topicPrefix]);

  // Persistent save triggers
  useEffect(() => {
    localStorage.setItem("lumina_mqtt_config", JSON.stringify(brokerConfig));
  }, [brokerConfig]);

  useEffect(() => {
    localStorage.setItem("lumina_relays_state", JSON.stringify(relays));
  }, [relays]);

  // Initial greeting logs
  useEffect(() => {
    addLog("Konsol Lumina MQTT Controller siap. Menunggu perintah...", "success", "SYSTEM");
    addLog("Default Broker diatur ke 'MyQTTHub' dengan warna aksen forest green (#404e3b).", "info", "SYSTEM");
  }, []);

  // Helpers to add log rows
  const addLog = (
    message: string,
    type: LogEntry["type"] = "info",
    source: LogEntry["source"] = "SYSTEM"
  ) => {
    const timeString = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeString,
      source,
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog("Histori log dibersihkan.", "info", "SYSTEM");
  };

  // Connect or disconnect function
  const handleToggleConnection = () => {
    if (isConnected) {
      if (clientRef.current) {
        clientRef.current.end();
      }
      setIsConnected(false);
      setIsConnecting(false);
      addLog("Koneksi diputuskan oleh pengguna melalui navigasi.", "warning", "SYSTEM");
    } else {
      connectToMqtt();
    }
  };

  const connectToMqtt = () => {
    setIsConnecting(true);
    addLog(`Menghubungkan ke broker [${brokerConfig.server}:${brokerConfig.port}] menggunakan WebSockets...`, "info", "MQTT");

    // Clear old client if any
    if (clientRef.current) {
      clientRef.current.end(true);
    }

    try {
      // Build proper websocket URL
      const url = `${brokerConfig.protocol}://${brokerConfig.server}:${brokerConfig.port}`;
      
      const options = {
        clientId: brokerConfig.clientId,
        username: brokerConfig.user,
        password: brokerConfig.pass,
        keepalive: 60,
        reconnectPeriod: 5000,
        connectTimeout: 8000,
        clean: true,
      };

      const client = mqtt.connect(url, options);

      client.on("connect", () => {
        setIsConnected(true);
        setIsConnecting(false);
        addLog("Web BERHASIL TERHUBUNG ke broker MyQTTHub!", "success", "MQTT");
        
        // Subscribe to feed topics to synchronize updates from real ESP32
        relays.forEach(r => {
          client.subscribe(`${r.topic}/state`, (err) => {
            if (!err) {
              console.log(`Subscribed to status topic: ${r.topic}/state`);
            }
          });
        });
      });

      client.on("message", (topic, payload) => {
        const msg = payload.toString();
        // Look up corresponding relay
        const matchedRelay = relays.find(r => topic === `${r.topic}/state`);
        if (matchedRelay) {
          const isOpen = msg === matchedRelay.payloadOn || msg === "on" || msg === "1";
          setRelays(prev =>
            prev.map(r => r.id === matchedRelay.id ? { ...r, isOpen } : r)
          );
          addLog(`Menerima umpan balik ESP32: [${matchedRelay.name}] diatur ke ${isOpen ? "ON" : "OFF"}.`, "success", "MQTT");
        }
      });

      client.on("reconnect", () => {
        addLog("Mencoba menghubungkan ulang ke server MyQTTHub...", "info", "MQTT");
      });

      client.on("error", (err) => {
        setIsConnected(false);
        setIsConnecting(false);
        addLog(`Gagal terhubung atau bermasalah dengan broker: ${err.message}`, "error", "MQTT");
        client.end();
      });

      client.on("close", () => {
        setIsConnected(false);
        setIsConnecting(false);
        addLog("Hubungan dengan MyQTTHub secara aman ditutup.", "warning", "MQTT");
      });

      clientRef.current = client;

    } catch (e: any) {
      setIsConnecting(false);
      setIsConnected(false);
      addLog(`Kesalahan inisiasi modul MQTT: ${e.message}`, "error", "SYSTEM");
    }
  };

  // Toggle relay
  const handleToggleRelayId = (id: number) => {
    setRelays((prevRelays) =>
      prevRelays.map((r) => {
        if (r.id === id) {
          const nextState = !r.isOpen;
          const payload = nextState ? r.payloadOn : r.payloadOff;
          const stateLabel = nextState ? "DINYALAKAN" : "DIMATIKAN";

          // Log active event
          addLog(`Tombol ${r.name} ditekan. Mengubah status ke [${stateLabel}]`, "info", "RELAY");

          // Publish actually if connected
          if (isConnected && clientRef.current) {
            clientRef.current.publish(r.topic, payload, { qos: 0, retain: true }, (err) => {
              if (err) {
                addLog(`Gagal mempublikasi status ke topik: ${r.topic}`, "error", "MQTT");
              } else {
                addLog(`Mempublikasi payload [${payload}] ke topik "${r.topic}"`, "success", "MQTT");
              }
            });
          }

          return { ...r, isOpen: nextState };
        }
        return r;
      })
    );
  };

  // Receive voice commands parsed helper
  const handleVoiceCommand = (
    rawText: string,
    parsed: { target: string; action: "ON" | "OFF" | "ALL_ON" | "ALL_OFF" | "UNKNOWN" }
  ) => {
    if (parsed.action === "UNKNOWN") return;

    if (parsed.action === "ALL_ON" || parsed.action === "ALL_OFF") {
      const stateToSet = parsed.action === "ALL_ON";
      relays.forEach((r) => {
        if (r.isOpen !== stateToSet) {
          handleToggleRelayId(r.id);
        }
      });
    } else {
      const id = Number(parsed.target);
      const isRelayOn = relays.find(r => r.id === id)?.isOpen;
      const targetStateOn = parsed.action === "ON";

      if (id >= 1 && id <= 4) {
        if (isRelayOn !== targetStateOn) {
          handleToggleRelayId(id);
        } else {
          addLog(`Status ${relays[id - 1].name} sudah ${targetStateOn ? "ON" : "OFF"}. Tidak ada aksi tambahan.`, "info", "RELAY");
        }
      }
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#f8f9f8] text-[#2d362a] flex flex-col font-sans">
      {/* Premium Connection Status Header */}
      <Navbar
        isConnected={isConnected}
        isConnecting={isConnecting}
        selectedBroker={selectedBroker}
        onBrokerChange={(broker) => {
          setSelectedBroker(broker);
          addLog(`Mengubah target broker ke [${broker.toUpperCase()}]`, "info", "SYSTEM");
        }}
        onToggleConnect={handleToggleConnection}
      />

      {/* Main Container Dashboard */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Top Hero and Info Panel */}
        <section className="bg-[#ecf2eb] border border-[#404e3b]/15 rounded-2xl p-6 relative overflow-hidden shadow-xs">
          {/* Subtle Ambient Background Glow with user's core #404e3b accent */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#404e3b] opacity-5 filter blur-[80px]" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <span className="text-[10px] bg-[#404e3b] border border-[#404e3b]/10 text-white font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Vite + MQTT over SSL WebSocket
              </span>
              <h2 className="text-2xl font-black tracking-tight text-[#2d362a]">
                Lumina Home Control Center
              </h2>
              <p className="text-sm text-[#2d362a]/85 leading-relaxed">
                Antarmuka panel kendali 4-channel relay lampu cerdas. Atur status listrik, fungsikan asisten suara lisan dengan respons instan broker <span className="text-[#404e3b] font-bold">MyQTTHub</span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://myqtthub.com"
                target="_blank"
                rel="no-referrer"
                className="bg-white hover:bg-neutral-50 p-2.5 px-4 rounded-xl text-xs font-bold text-[#2d362a] border border-[#e2e8e1] flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                MyQTTHub Portal
                <ExternalLink className="w-3.5 h-3.5 text-[#404e3b]" />
              </a>
              <div className="bg-[#404e3b] text-white p-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-[#404e3b] shadow-xs">
                <Cpu className="w-4 h-4" />
                ESP32 Aktif
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Responsive Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Config Room & Main Controller Widgets */}
          <section className="lg:col-span-8 space-y-6">
            {/* Broker Settings Panel Component */}
            <BrokerConfigPanel
              config={brokerConfig}
              onSaveConfig={(updated) => {
                setBrokerConfig(updated);
                addLog("Konfigurasi broker berhasil disimpan dan diperbarui.", "success", "SYSTEM");
              }}
              isConnected={isConnected}
            />

            {/* Main Interactive Lamp Controller Variations */}
            <RelayControls
              relays={relays}
              onToggleRelay={handleToggleRelayId}
              isConnected={isConnected}
            />
          </section>

          {/* Right Column: Voice commands and Activity Log panel side-bar */}
          <aside className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            {/* Speech Recognition Box */}
            <VoiceCommandController
              onCommandReceived={handleVoiceCommand}
              onLogMessage={addLog}
              disabled={false}
            />

            {/* Interactive logging console */}
            <ActivityLogPanel logs={logs} onClearLogs={handleClearLogs} />
          </aside>
        </div>

        {/* Code Guide & Setup Instructions */}
        <section className="bg-white border border-[#404e3b]/15 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#404e3b]" />
            <h3 className="text-sm font-bold text-[#2d362a] uppercase tracking-widest font-mono">
              Petunjuk Integrasi Kode ESP32 (MyQTTHub)
            </h3>
          </div>

          <div className="text-xs text-[#2d362a]/70 leading-relaxed space-y-3">
            <p>
              Untuk mengintegrasikan perangkat fisik ESP32 Anda dengan dashboard web lumina ini menggunakan pustaka <span className="font-mono text-[#2d362a] bg-[#f2f4f1] px-1 py-0.5 rounded font-black">PubSubClient</span> Arduino, gunakan cuplikan parameter sesuai dengan yang Anda simpan di atas:
            </p>

            <pre className="bg-[#181d17] p-4 rounded-xl border border-[#2d362a]/20 font-mono text-neutral-200 overflow-x-auto text-[11px] leading-relaxed shadow-inner">
{`// === CONFIGURATION DETAILS FOR ESP32 ARDUINO ===
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "WiFi_Anda";
const char* password = "Sandi_WiFi_Anda";

// Kredensial sesuai dengan setelan Broker Settings Anda
const char* mqtt_server = "${brokerConfig.server}";
const int mqtt_port = 1883; // Gunakan port 1883 murni TCP pada ESP32 (dashboard web menggunakan websockets)
const char* mqtt_client_id = "${brokerConfig.clientId.replace("_web", "")}"; // Client ID unik ESP32
const char* mqtt_user = "${brokerConfig.user}";
const char* mqtt_pass = "${brokerConfig.pass}";

// Daftar Topik Relay yang didaftarkan secara atomik:
// 1. ${brokerConfig.topicPrefix}1 (Lampu Teras)
// 2. ${brokerConfig.topicPrefix}2 (Lampu Ruang Utama)
// 3. ${brokerConfig.topicPrefix}3 (Lampu Area Dapur)
// 4. ${brokerConfig.topicPrefix}4 (Lampu Kamar Tidur)`}
            </pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="app-footer" className="bg-white border-t border-[#e2e8e1] py-6 px-4 md:px-8 mt-12 text-center text-xs text-[#2d362a]/60 font-mono font-bold tracking-wide uppercase shadow-xs">
        <p>© 2026 Lumina Intelligent Core. Didesain dengan aksen warna alami #404e3b.</p>
      </footer>
    </div>
  );
}
