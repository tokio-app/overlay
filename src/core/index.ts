import config from "../config";
import {
  AppEvents,
  EventMap,
  Subscribers,
  TOKIO_EVENTS,
  TokioCloseEvent,
  TokioErrorEvent,
  TokioPayload,
} from "../types";
import ReconnectingWebSocket from "./websocket";

export { TOKIO_EVENTS };

// Events sent by the `Tokio App`. OPEN, ERROR and CLOSE come from this library.
const APP_EVENTS = new Set<string>(
  Object.values(TOKIO_EVENTS).filter(
    (event): event is AppEvents =>
      event !== TOKIO_EVENTS.OPEN &&
      event !== TOKIO_EVENTS.ERROR &&
      event !== TOKIO_EVENTS.CLOSE,
  ),
);

const isPayload = (payload: unknown): payload is TokioPayload =>
  typeof payload === "object" &&
  payload !== null &&
  "type" in payload &&
  typeof payload.type === "string" &&
  APP_EVENTS.has(payload.type);

export class EventLoader {
  private _ws: ReconnectingWebSocket | null = null;
  private _subscribers: Subscribers = {};

  private _iframeListener: ((event: MessageEvent) => void) | null = null;

  /**
   * Initializes the event loader. Inside a `Tokio App` preview it listens for the
   * events the App posts to the iframe, anywhere else it connects to the WebSocket server.
   *
   * @param id - Overlay ID assigned by the `Tokio App`.
   * @param wsurl - Optional WebSocket server URL. If omitted, it falls back to `Tokio App default`.
   */
  public connect(id: string, wsurl?: string): void {
    this.disconnect();
    if (window.name === `TOKIO_APP-${id}`) {
      this._initIframeListener();
    } else {
      this._initWebSocket(id, wsurl ?? config.WS_URL);
    }
  }

  /**
   * Closes the active WebSocket connection and stops listening for previews.
   * Subscribers stay registered, and no CLOSE event is sent for this connection.
   */
  public disconnect(): void {
    if (this._ws) {
      // Its close event would otherwise reach subscribers after a new `connect`.
      this._ws.onopen = null;
      this._ws.onmessage = null;
      this._ws.onerror = null;
      this._ws.onclose = null;
      this._ws.close();
      this._ws = null;
    }

    if (this._iframeListener) {
      window.removeEventListener("message", this._iframeListener);
      this._iframeListener = null;
    }
  }

  /**
   * Subscribes a callback function to a specific `Tokio` event.
   *
   * @param event - The name of the event to listen for.
   * @param callback - The callback function executed when the event fires.
   * @returns A cleanup function that unsubscribes this specific listener when called.
   *
   * @example
   * const unsubscribe = tokio.on(TOKIO_EVENTS.CHAT, (data) => {
   *   console.log('Received CHAT payload:', data);
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
    callbacks.forEach((callback) => {
      // A failing subscriber must not keep the others from running.
      try {
        callback(payload);
      } catch (err) {
        console.error(`Tokio subscriber for ${event} failed:`, err);
      }
    });
  }

  private _initWebSocket(id: string, wsurl: string): void {
    if (!id) {
      console.warn("Tokio: connect() needs the overlay ID, not connecting.");
      return;
    }

    const url = new URL(wsurl);
    url.searchParams.set("id", id);

    this._ws = new ReconnectingWebSocket(url.toString(), [], {
      minReconnectionDelay: 2000 + Math.random() * 1000,
      reconnectionDelayGrowFactor: 1.5,
      maxReconnectionDelay: 30000,
      connectionTimeout: 5000,
    });

    this._ws.onopen = () => {
      this._publish(TOKIO_EVENTS.OPEN, undefined);
    };

    this._ws.onmessage = (event) => {
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
        return;
      }
      this._handleEvents(payload);
    };

    this._ws.onerror = (event) => {
      const errorPayload: TokioErrorEvent = {
        type: "error",
        message: event.message || "WebSocket Error",
        error: event.error || new Error(event.message || "WebSocket Error"),
      };
      this._publish(TOKIO_EVENTS.ERROR, errorPayload);
    };

    this._ws.onclose = (event) => {
      const closePayload: TokioCloseEvent = {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      };
      this._publish(TOKIO_EVENTS.CLOSE, closePayload);
    };
  }

  private _initIframeListener(): void {
    this._iframeListener = (event: MessageEvent) => {
      // Previews are posted by the `Tokio App` page that embeds the overlay.
      if (event.source !== window.parent) return;
      let msg: unknown = event.data;
      if (typeof msg === "string") {
        try {
          msg = JSON.parse(msg);
        } catch {
          return;
        }
      }
      if (
        typeof msg === "object" &&
        msg !== null &&
        "action" in msg &&
        msg.action === "TOKIO_PREVIEW" &&
        "payload" in msg
      ) {
        this._handleEvents(msg.payload);
      }
    };
    window.addEventListener("message", this._iframeListener);
  }

  private _handleEvents(payload: unknown) {
    if (isPayload(payload)) {
      this._publish(payload.type, payload.data);
    } else {
      const type =
        typeof payload === "object" && payload !== null && "type" in payload
          ? payload.type
          : undefined;
      console.warn(`Received unknown Tokio event type: ${String(type)}`);
    }
  }
}
