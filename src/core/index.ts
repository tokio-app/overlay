import config from "../config";
import {
  EventMap,
  Subscribers,
  TOKIO_EVENTS,
  TokioCloseEvent,
  TokioErrorEvent,
  TokioPayload,
  TokioPreviewMessage,
} from "../types";

export { TOKIO_EVENTS };

export class EventLoader {
  private _ws: WebSocket | null;
  private _wsurl?: string;
  private _subscribers: Subscribers;

  constructor() {
    this._ws = null;
    this._wsurl = undefined;
    this._subscribers = {};
  }

  /**
   * Initializes the event loader by connecting to the WebSocket server
   * and setting up the iframe `postMessage` listener for on App previews.
   *
   * @param wsurl - Optional WebSocket server URL. If omitted, it falls back to `Tokio App default`.
   */
  public connect(wsurl?: string): void {
    this._wsurl = wsurl ?? config.WS_URL;
    this._initWebSocket();
    this._initIframeListener();
  }

  /**
   * Closes the active WebSocket connection and removes all registered event subscribers.
   */
  public disconnect(): void {
    if (this._ws) {
      this._ws.close();
    }
    this._subscribers = {};
  }

  /**
   * Subscribes a callback function to a specific `Tokio` event.
   *
   * @param event - The name of the event to listen for.
   * @param callback - The callback function executed when the event fires.
   * @returns A cleanup function that unsubscribes this specific listener when called.
   *
   * @example
   * const unsubscribe = TokioEventLoader.on(TOKIO_EVENTS.DATA, (data) => {
   *   console.log('Received payload:', data);
   * });
   *
   * // Later, to unsubscribe:
   * unsubscribe();
   */
  public on<K extends TOKIO_EVENTS>(
    event: K,
    callback: (payload: EventMap[K]) => void,
  ): () => void {
    if (!this._subscribers[event]) {
      this._subscribers[event] = new Set() as unknown as Subscribers[K];
    }
    this._subscribers[event]!.add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Removes a previously registered callback function from an event.
   *
   * @param event - The event name the callback was subscribed to.
   * @param callback - The exact callback function instance to remove.
   */
  public off<K extends TOKIO_EVENTS>(
    event: K,
    callback: (payload: EventMap[K]) => void,
  ): void {
    const callbacks = this._subscribers[event];
    if (!callbacks) return;
    callbacks.delete(callback);
  }

  private _publish<K extends TOKIO_EVENTS>(
    event: K,
    payload: EventMap[K],
  ): void {
    const callbacks = this._subscribers[event];
    if (!callbacks) return;
    callbacks.forEach((callback) => callback(payload));
  }

  private _initWebSocket(): void {
    if (!this._wsurl) return;

    this._ws = new WebSocket(this._wsurl);

    this._ws.onopen = () => {
      this._publish(TOKIO_EVENTS.OPEN, undefined as any);
    };

    this._ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as TokioPayload;
        this._handleEvents(payload);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    this._ws.onerror = (error: any) => {
      const errorPayload: TokioErrorEvent = {
        type: error?.type ?? "error",
        message: error?.message ?? "WebSocket Error",
        error: error ?? new Error("WebSocket Error"),
      };
      this._publish(TOKIO_EVENTS.ERROR, errorPayload);
    };

    this._ws.onclose = (event: any) => {
      const closePayload: TokioCloseEvent = {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      };
      this._publish(TOKIO_EVENTS.CLOSE, closePayload);
    };
  }

  private _initIframeListener(): void {
    window.addEventListener("message", (event: MessageEvent) => {
      const msg = event.data as TokioPreviewMessage;
      if (msg && msg.action === "TOKIO_PREVIEW" && msg.payload !== undefined) {
        this._handleEvents(msg.payload);
      }
    });
  }

  private _handleEvents(payload: TokioPayload) {
    switch (payload.type) {
      case TOKIO_EVENTS.CHAT:
        this._publish(TOKIO_EVENTS.CHAT, payload.data);
        break;
      case TOKIO_EVENTS.SHARE:
        this._publish(TOKIO_EVENTS.SHARE, payload.data);
        break;
      case TOKIO_EVENTS.FOLLOW:
        this._publish(TOKIO_EVENTS.FOLLOW, payload.data);
        break;
      case TOKIO_EVENTS.GIFT:
        this._publish(TOKIO_EVENTS.GIFT, payload.data);
        break;
      case TOKIO_EVENTS.LIKE:
        this._publish(TOKIO_EVENTS.LIKE, payload.data);
        break;
      case TOKIO_EVENTS.SUPER_FAN:
        this._publish(TOKIO_EVENTS.SUPER_FAN, payload.data);
        break;
      case TOKIO_EVENTS.MEMBER_JOIN:
        this._publish(TOKIO_EVENTS.MEMBER_JOIN, payload.data);
        break;
      case TOKIO_EVENTS.SUPER_FAN_JOIN:
        this._publish(TOKIO_EVENTS.SUPER_FAN_JOIN, payload.data);
        break;
      case TOKIO_EVENTS.ROOM_USER:
        this._publish(TOKIO_EVENTS.ROOM_USER, payload.data);
        break;
      default:
        console.warn(`Received unknown Tokio event type: ${payload.type}`);
    }
  }
}
