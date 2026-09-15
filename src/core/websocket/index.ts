import * as Events from "./events";

interface WebSocketConstructor {
  new (url: string, protocols?: string | string[]): WebSocket;
}

const getGlobalWebSocket = (): WebSocketConstructor | undefined => {
  if (typeof WebSocket !== "undefined") {
    return WebSocket as unknown as WebSocketConstructor;
  }
  return undefined;
};

const isWebSocket = (w: unknown): w is WebSocketConstructor => {
  return typeof w !== "undefined" && w !== null;
};

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export type Event = Events.Event;
export type ErrorEvent = Events.ErrorEvent;
export type CloseEvent = Events.CloseEvent;

export type Options = {
  WebSocket?: WebSocketConstructor;
  maxReconnectionDelay?: number;
  minReconnectionDelay?: number;
  reconnectionDelayGrowFactor?: number;
  minUptime?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  maxEnqueuedMessages?: number;
  startClosed?: boolean;
  debug?: boolean;
};

const defaultOptions = {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 1000 + Math.random() * 4000,
  minUptime: 5000,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4000,
  maxRetries: Infinity,
  maxEnqueuedMessages: Infinity,
  startClosed: false,
  debug: false,
};

export type UrlProvider = string | (() => string) | (() => Promise<string>);

export type Message = string | ArrayBuffer | Blob | ArrayBufferView;

export type ListenersMap = {
  error: Array<Events.WebSocketEventListenerMap["error"]>;
  message: Array<Events.WebSocketEventListenerMap["message"]>;
  open: Array<Events.WebSocketEventListenerMap["open"]>;
  close: Array<Events.WebSocketEventListenerMap["close"]>;
};

export default class ReconnectingWebSocket {
  private _ws?: WebSocket;
  private _listeners: ListenersMap = {
    error: [],
    message: [],
    open: [],
    close: [],
  };
  private _retryCount = -1;
  private _uptimeTimeout?: ReturnType<typeof setTimeout>;
  private _connectTimeout?: ReturnType<typeof setTimeout>;
  private _shouldReconnect = true;
  private _connectLock = false;
  private _binaryType: BinaryType = "blob";
  private _closeCalled = false;
  private _messageQueue: Message[] = [];

  private readonly _url: UrlProvider;
  private readonly _protocols?: string | string[];
  private readonly _options: Options;

  constructor(
    url: UrlProvider,
    protocols?: string | string[],
    options: Options = {},
  ) {
    this._url = url;
    this._protocols = protocols;
    this._options = options;

    if (this._options.startClosed) {
      this._shouldReconnect = false;
    }

    this._connect();
  }

  get readyStateConstants(): typeof ReadyState {
    return ReadyState;
  }

  get binaryType(): BinaryType {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }

  set binaryType(value: BinaryType) {
    this._binaryType = value;
    if (this._ws) {
      this._ws.binaryType = value;
    }
  }

  get retryCount(): number {
    return Math.max(this._retryCount, 0);
  }

  get bufferedAmount(): number {
    const bytes = this._messageQueue.reduce((acc, message) => {
      if (typeof message === "string") {
        return acc + new Blob([message]).size;
      } else if (message instanceof Blob) {
        return acc + message.size;
      } else {
        return acc + message.byteLength;
      }
    }, 0);
    return bytes + (this._ws ? this._ws.bufferedAmount : 0);
  }

  get extensions(): string {
    return this._ws ? this._ws.extensions : "";
  }

  get protocol(): string {
    return this._ws ? this._ws.protocol : "";
  }

  get readyState(): ReadyState {
    if (this._ws) {
      return this._ws.readyState;
    }
    return this._options.startClosed
      ? ReadyState.CLOSED
      : ReadyState.CONNECTING;
  }

  get url(): string {
    return this._ws ? this._ws.url : "";
  }

  public onclose: ((event: Events.CloseEvent) => void) | null = null;
  public onerror: ((event: Events.ErrorEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onopen: ((event: Event) => void) | null = null;

  public close(code = 1000, reason?: string): void {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === ReadyState.CLOSED) {
      this._debug("close: already closed");
      return;
    }
    this._ws.close(code, reason);
  }

  public reconnect(code?: number, reason?: string): void {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === ReadyState.CLOSED) {
      this._connect();
    } else {
      this._disconnect(code, reason);
      this._connect();
    }
  }

  public send(data: Message): void {
    if (this._ws && this._ws.readyState === ReadyState.OPEN) {
      this._debug("send", data);
      this._ws.send(data as Parameters<WebSocket["send"]>[0]);
    } else {
      const { maxEnqueuedMessages = defaultOptions.maxEnqueuedMessages } =
        this._options;
      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug("enqueue", data);
        this._messageQueue.push(data);
      }
    }
  }

  public addEventListener<T extends keyof Events.WebSocketEventListenerMap>(
    type: T,
    listener: Events.WebSocketEventListenerMap[T],
  ): void {
    const listeners = this._listeners[type] as Array<
      Events.WebSocketEventListenerMap[T]
    >;
    if (listeners) {
      listeners.push(listener);
    }
  }

  public dispatchEvent(event: Event): boolean {
    const listeners =
      this._listeners[event.type as keyof Events.WebSocketEventListenerMap];
    if (listeners) {
      for (const listener of listeners) {
        this._callEventListener(event as never, listener as never);
      }
    }
    return true;
  }

  public removeEventListener<T extends keyof Events.WebSocketEventListenerMap>(
    type: T,
    listener: Events.WebSocketEventListenerMap[T],
  ): void {
    if (this._listeners[type]) {
      const listeners = this._listeners[type] as Array<
        Events.WebSocketEventListenerMap[T]
      >;
      this._listeners[type] = listeners.filter((l) => l !== listener) as any;
    }
  }

  private _debug(...args: unknown[]): void {
    if (this._options.debug) {
      console.log.apply(console, ["RWS>", ...args]);
    }
  }

  private _getNextDelay(): number {
    const {
      reconnectionDelayGrowFactor = defaultOptions.reconnectionDelayGrowFactor,
      minReconnectionDelay = defaultOptions.minReconnectionDelay,
      maxReconnectionDelay = defaultOptions.maxReconnectionDelay,
    } = this._options;

    let delay = 0;
    if (this._retryCount > 0) {
      delay =
        minReconnectionDelay *
        Math.pow(reconnectionDelayGrowFactor, this._retryCount - 1);
      if (delay > maxReconnectionDelay) {
        delay = maxReconnectionDelay;
      }
    }
    this._debug("next delay", delay);
    return delay;
  }

  private _wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this._getNextDelay());
    });
  }

  private async _getNextUrl(urlProvider: UrlProvider): Promise<string> {
    if (typeof urlProvider === "string") {
      return urlProvider;
    }
    if (typeof urlProvider === "function") {
      const url = await Promise.resolve(urlProvider());
      if (typeof url === "string") {
        return url;
      }
    }
    throw new Error("Invalid URL");
  }

  private async _connect(): Promise<void> {
    if (this._connectLock || !this._shouldReconnect) {
      return;
    }
    this._connectLock = true;

    const {
      maxRetries = defaultOptions.maxRetries,
      connectionTimeout = defaultOptions.connectionTimeout,
      WebSocket = getGlobalWebSocket(),
    } = this._options;

    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      return;
    }

    this._retryCount++;
    this._debug("connect", this._retryCount);
    this._removeListeners();

    if (!isWebSocket(WebSocket)) {
      throw new Error("No valid WebSocket class provided");
    }

    try {
      await this._wait();
      const url = await this._getNextUrl(this._url);

      if (this._closeCalled) {
        this._connectLock = false;
        return;
      }

      this._debug("connect", { url, protocols: this._protocols });

      this._ws = this._protocols
        ? new WebSocket(url, this._protocols)
        : new WebSocket(url);

      this._ws.binaryType = this._binaryType;
      this._connectLock = false;
      this._addListeners();

      this._connectTimeout = setTimeout(
        () => this._handleTimeout(),
        connectionTimeout,
      );
    } catch (error) {
      this._connectLock = false;
      this._handleError(
        new Events.ErrorEvent(
          error instanceof Error ? error : new Error(String(error)),
          this,
        ),
      );
    }
  }

  private _handleTimeout(): void {
    this._debug("timeout event");
    this._handleError(new Events.ErrorEvent(new Error("timeout"), this));
  }

  private _disconnect(code = 1000, reason?: string): void {
    this._clearTimeouts();
    if (!this._ws) {
      return;
    }
    this._removeListeners();
    try {
      this._ws.close(code, reason);
      this._handleClose(new Events.CloseEvent(code, reason, this));
    } catch {
      // ignore
    }
  }

  private _acceptOpen(): void {
    this._debug("accept open");
    this._retryCount = 0;
  }

  private _callEventListener<T extends keyof Events.WebSocketEventListenerMap>(
    event: Events.WebSocketEventMap[T],
    listener: Events.WebSocketEventListenerMap[T],
  ): void {
    if (typeof listener === "function") {
      (listener as (e: Events.WebSocketEventMap[T]) => void)(event);
    } else if (listener && "handleEvent" in listener) {
      (
        listener as { handleEvent: (e: Events.WebSocketEventMap[T]) => void }
      ).handleEvent(event);
    }
  }

  private _handleOpen = (event: globalThis.Event | Event): void => {
    this._debug("open event");
    const { minUptime = defaultOptions.minUptime } = this._options;

    clearTimeout(this._connectTimeout);
    this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime);

    if (this._ws) {
      this._ws.binaryType = this._binaryType;
    }

    const customEvent =
      event instanceof Events.Event ? event : new Events.Event("open", this);

    this._messageQueue.forEach((message) =>
      this._ws?.send(message as Parameters<WebSocket["send"]>[0]),
    );
    this._messageQueue = [];

    if (this.onopen) {
      this.onopen(customEvent);
    }

    const openListeners = this._listeners.open;
    openListeners.forEach((listener) =>
      this._callEventListener<"open">(customEvent, listener),
    );
  };

  private _handleMessage = (event: MessageEvent): void => {
    this._debug("message event");

    if (this.onmessage) {
      this.onmessage(event);
    }

    const messageListeners = this._listeners.message;
    messageListeners.forEach((listener) =>
      this._callEventListener<"message">(event, listener),
    );
  };

  private _handleError = (
    event: globalThis.Event | Events.ErrorEvent,
  ): void => {
    let errorMessage = "WebSocket Error";
    if (event instanceof Events.ErrorEvent) {
      errorMessage = event.message;
    }

    this._debug("error event", errorMessage);
    this._disconnect(
      undefined,
      errorMessage === "timeout" ? "timeout" : undefined,
    );

    const customEvent =
      event instanceof Events.ErrorEvent
        ? event
        : new Events.ErrorEvent(errorMessage, this);

    if (this.onerror) {
      this.onerror(customEvent);
    }

    this._debug("exec error listeners");
    const errorListeners = this._listeners.error;
    errorListeners.forEach((listener) =>
      this._callEventListener<"error">(customEvent, listener),
    );

    this._connect();
  };

  private _handleClose = (
    event: globalThis.CloseEvent | Events.CloseEvent,
  ): void => {
    this._debug("close event");
    this._clearTimeouts();

    if (this._shouldReconnect) {
      this._connect();
    }

    const customEvent =
      event instanceof Events.CloseEvent
        ? event
        : new Events.CloseEvent(event.code, event.reason, this);

    if (this.onclose) {
      this.onclose(customEvent);
    }

    const closeListeners = this._listeners.close;
    closeListeners.forEach((listener) =>
      this._callEventListener<"close">(customEvent, listener),
    );
  };

  private _removeListeners(): void {
    if (!this._ws) return;

    this._debug("removeListeners");
    this._ws.removeEventListener("open", this._handleOpen as EventListener);
    this._ws.removeEventListener("close", this._handleClose as EventListener);
    this._ws.removeEventListener(
      "message",
      this._handleMessage as EventListener,
    );
    this._ws.removeEventListener("error", this._handleError as EventListener);
  }

  private _addListeners(): void {
    if (!this._ws) return;

    this._debug("addListeners");
    this._ws.addEventListener("open", this._handleOpen as EventListener);
    this._ws.addEventListener("close", this._handleClose as EventListener);
    this._ws.addEventListener("message", this._handleMessage as EventListener);
    this._ws.addEventListener("error", this._handleError as EventListener);
  }

  private _clearTimeouts(): void {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
}
