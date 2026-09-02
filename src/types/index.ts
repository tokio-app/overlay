import {
  ChatEvent,
  FollowEvent,
  GiftEvent,
  LikeEvent,
  MemberEvent,
  RoomUserEvent,
  ShareEvent,
  SuperFanEvent,
  SuperFanJoinEvent,
} from "./events";

export enum TOKIO_EVENTS {
  OPEN = "tokio:open",
  ERROR = "tokio:error",
  CLOSE = "tokio:close",
  // SAME as TIKTOK_EVENTS
  CHAT = "tiktok:chat",
  SHARE = "tiktok:share",
  FOLLOW = "tiktok:follow",
  GIFT = "tiktok:gift",
  LIKE = "tiktok:like",
  ENVELOPE = "tiktok:envelope",
  SUPER_FAN = "tiktok:superfan",
  SUPER_FAN_BOX = "tiktok:superfanbox",
  SUPER_FAN_JOIN = "tiktok:superfanjoin",
  MEMBER_JOIN = "tiktok:memberjoin",
  ROOM_USER = "tiktok:roomuser",
}

export interface EventMap {
  [TOKIO_EVENTS.OPEN]: void;
  [TOKIO_EVENTS.ERROR]: TokioErrorEvent;
  [TOKIO_EVENTS.CLOSE]: TokioCloseEvent;
  [TOKIO_EVENTS.CHAT]: ChatEvent;
  [TOKIO_EVENTS.SHARE]: ShareEvent;
  [TOKIO_EVENTS.FOLLOW]: FollowEvent;
  [TOKIO_EVENTS.GIFT]: GiftEvent;
  [TOKIO_EVENTS.LIKE]: LikeEvent;
  [TOKIO_EVENTS.ENVELOPE]: void;
  [TOKIO_EVENTS.SUPER_FAN_BOX]: void;
  [TOKIO_EVENTS.SUPER_FAN]: SuperFanEvent;
  [TOKIO_EVENTS.MEMBER_JOIN]: MemberEvent;
  [TOKIO_EVENTS.SUPER_FAN_JOIN]: SuperFanJoinEvent;
  [TOKIO_EVENTS.ROOM_USER]: RoomUserEvent;
}

export type AppEvents = Exclude<
  TOKIO_EVENTS,
  TOKIO_EVENTS.OPEN | TOKIO_EVENTS.ERROR | TOKIO_EVENTS.CLOSE
>;

export type TokioPayload = {
  [K in AppEvents]: {
    type: K;
    data: EventMap[K];
  };
}[AppEvents];

export interface TokioPreviewMessage {
  action: "TOKIO_PREVIEW";
  payload: TokioPayload;
}

export interface TokioErrorEvent {
  message?: string;
  type: string;
  error?: Error;
}

export interface TokioCloseEvent {
  code: number;
  reason: string;
  wasClean: boolean;
}

export type Subscribers = {
  [K in TOKIO_EVENTS]?: Set<(payload: EventMap[K]) => void>;
};
