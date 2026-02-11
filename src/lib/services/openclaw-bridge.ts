/**
 * OpenClaw Bridge Service
 * 
 * Manages WebSocket connection to the OpenClaw Gateway daemon.
 * Transforms OpenClaw events into TypeScript types for SCM layer consumption.
 * 
 * Architecture:
 * - Singleton pattern (only one connection per app instance)
 * - Event-driven (emits typed events for upstream consumers)
 * - Graceful degradation (operates in offline mode if daemon unavailable)
 */

import WebSocket from 'ws';
import { v7 as uuidv7 } from 'uuid';

export interface OpenClawMessage {
    id: string;
    type: 'command' | 'response' | 'event';
    timestamp: string;
    payload: unknown;
}

export interface OpenClawSearchResult {
    query: string;
    results: Array<{
        title: string;
        snippet: string;
        url: string;
        relevanceScore?: number;
    }>;
}

export interface OpenClawConnectionStatus {
    connected: boolean;
    lastPing?: Date;
    messagesReceived: number;
    messagesSent: number;
}

export type OpenClawEventHandler = (message: OpenClawMessage) => void | Promise<void>;

export class OpenClawBridgeService {
    private static instance: OpenClawBridgeService | null = null;
    private ws: WebSocket | null = null;
    private wsUrl: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // ms
    private eventHandlers: Map<string, OpenClawEventHandler[]> = new Map();
    private messageLog: OpenClawMessage[] = [];
    private stats = {
        messagesReceived: 0,
        messagesSent: 0,
        lastPing: null as Date | null,
    };

    private constructor(wsUrl?: string) {
        this.wsUrl = wsUrl || process.env.OPENCLAW_WS_URL || 'ws://127.0.0.1:18789';
    }

    /**
     * Get singleton instance
     */
    public static getInstance(wsUrl?: string): OpenClawBridgeService {
        if (!OpenClawBridgeService.instance) {
            OpenClawBridgeService.instance = new OpenClawBridgeService(wsUrl);
        }
        return OpenClawBridgeService.instance;
    }

    /**
     * Connect to OpenClaw Gateway
     */
    public async connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('[OpenClawBridge] Already connected');
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);

                this.ws.on('open', () => {
                    console.log('[OpenClawBridge] Connected to OpenClaw Gateway');
                    this.reconnectAttempts = 0;
                    this.stats.lastPing = new Date();
                    resolve();
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    this.handleMessage(data);
                });

                this.ws.on('error', (error) => {
                    console.error('[OpenClawBridge] WebSocket error:', error);
                    reject(error);
                });

                this.ws.on('close', () => {
                    console.log('[OpenClawBridge] Connection closed');
                    this.attemptReconnect();
                });
            } catch (error) {
                console.error('[OpenClawBridge] Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from OpenClaw Gateway
     */
    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Send a command to OpenClaw
     */
    public async sendCommand(command: string, payload: unknown = {}): Promise<string> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('[OpenClawBridge] Not connected to OpenClaw Gateway');
        }

        const message: OpenClawMessage = {
            id: uuidv7(),
            type: 'command',
            timestamp: new Date().toISOString(),
            payload: { command, ...(payload || {}) },
        };

        this.ws.send(JSON.stringify(message));
        this.messageLog.push(message);
        this.stats.messagesSent++;

        return message.id;
    }

    /**
     * Register event handler
     */
    public on(eventType: string, handler: OpenClawEventHandler): void {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType)!.push(handler);
    }

    /**
     * Get connection status
     */
    public getStatus(): OpenClawConnectionStatus {
        return {
            connected: this.ws?.readyState === WebSocket.OPEN,
            lastPing: this.stats.lastPing ?? undefined,
            messagesReceived: this.stats.messagesReceived,
            messagesSent: this.stats.messagesSent,
        };
    }

    /**
     * Get message trace (for MASA M6.2 compliance)
     */
    public getMessageTrace(messageId?: string): OpenClawMessage[] {
        if (messageId) {
            return this.messageLog.filter(msg => msg.id === messageId);
        }
        return [...this.messageLog];
    }

    /**
     * Handle incoming WebSocket message
     */
    private handleMessage(data: WebSocket.Data): void {
        try {
            const message = JSON.parse(data.toString()) as OpenClawMessage;
            this.messageLog.push(message);
            this.stats.messagesReceived++;

            // Emit to registered handlers
            const handlers = this.eventHandlers.get(message.type) || [];
            const allHandlers = this.eventHandlers.get('*') || [];

            [...handlers, ...allHandlers].forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error('[OpenClawBridge] Error in event handler:', error);
                }
            });
        } catch (error) {
            console.error('[OpenClawBridge] Failed to parse message:', error);
        }
    }

    /**
     * Attempt reconnection with exponential backoff
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[OpenClawBridge] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[OpenClawBridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('[OpenClawBridge] Reconnect failed:', error);
            });
        }, delay);
    }
}
