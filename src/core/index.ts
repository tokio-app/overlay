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
  private _ws: WebSocket | null = null;
  private _wsurl?: string = undefined;
  private _subscribers: Subscribers = {};

  private _iframeListener: ((event: MessageEvent) => void) | null = null;

  /**
   * Initializes the event loader by connecting to the WebSocket server
   * and setting up the iframe `postMessage` listener for on App previews.
   *
   * @param wsurl - Optional WebSocket server URL. If omitted, it falls back to `Tokio App default`.
   */
  public connect(wsurl?: string): void {
    this.disconnect();
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
      this._ws = null;
    }

    if (this._iframeListener) {
      window.removeEventListener("message", this._iframeListener);
      this._iframeListener = null;
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
      this._publish(TOKIO_EVENTS.OPEN, undefined as never);
    };

    this._ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as TokioPayload;
        this._handleEvents(payload);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    this._ws.onerror = (error: Event) => {
      const errorPayload: TokioErrorEvent = {
        type: "error",
        message: "WebSocket Error",
        error: error instanceof Error ? error : new Error("WebSocket Error"),
      };
      this._publish(TOKIO_EVENTS.ERROR, errorPayload);
    };

    this._ws.onclose = (event: CloseEvent) => {
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
      const msg = event.data as TokioPreviewMessage;
      if (msg?.action === "TOKIO_PREVIEW" && msg.payload !== undefined) {
        this._handleEvents(msg.payload);
      }
    };
    window.addEventListener("message", this._iframeListener);
  }

  private _handleEvents(payload: TokioPayload) {
    const validEvents = Object.values(TOKIO_EVENTS);
    if (validEvents.includes(payload.type)) {
      this._publish(payload.type, payload.data);
    } else {
      console.warn(`Received unknown Tokio event type: ${payload.type}`);
    }
  }
}
