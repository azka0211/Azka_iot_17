/**
 * Types for Smart Relay Controller
 */

export interface RelayState {
  id: number;
  name: string;
  isOpen: boolean;
  topic: string;
  payloadOn: string;
  payloadOff: string;
  watts: number; // Simulated wattage
  lastUpdated?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: "MQTT" | "VOICE" | "RELAY" | "SYSTEM";
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export type BrokerType = "myqtthub" | "hivemq" | "emqx";

export interface BrokerConfig {
  type: BrokerType;
  name: string;
  server: string;
  port: number;
  protocol: "ws" | "wss";
  clientId: string;
  user: string;
  pass: string;
  topicPrefix: string;
}
