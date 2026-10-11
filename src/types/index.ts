import {
  ChatEvent,
  FollowEvent,
  GiftEvent,
  LikeEvent,
  MemberEvent,
  MusicInfo,
  RoomUserEvent,
  ShareEvent,
  SuperFanEvent,
  SuperFanJoinEvent,
} from "./events";

type CustomGift = {
  value: number;
  label: string;
  img: string;
  coins: number;
};

type ConfigValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | CustomGift
  | CustomGift[]
  | undefined;

type OverlayConfigRedux = {
  [id: string]: ConfigValue;
};

export enum TOKIO_EVENTS {
  OPEN = "tokio:open",
  ERROR = "tokio:error",
  CLOSE = "tokio:close",
  CONFIG = "tokio:config",
  // SAME as TIKTOK_EVENTS
  CHAT = "tokio:event:chat",
  SHARE = "tokio:event:share",
  FOLLOW = "tokio:event:follow",
  GIFT = "tokio:event:gift",
  LIKE = "tokio:event:like",
  ENVELOPE = "tokio:event:envelope",
  SUPER_FAN = "tokio:event:superfan",
  SUPER_FAN_BOX = "tokio:event:superfanbox",
  SUPER_FAN_JOIN = "tokio:event:superfanjoin",
  MEMBER_JOIN = "tokio:event:memberjoin",
  ROOM_USER = "tokio:event:roomuser",
  MUSIC_CHANGE = "tokio:event:music:change",
}

export interface EventMap {
  [TOKIO_EVENTS.OPEN]: void;
  [TOKIO_EVENTS.ERROR]: TokioErrorEvent;
  [TOKIO_EVENTS.CLOSE]: TokioCloseEvent;
  [TOKIO_EVENTS.CONFIG]: OverlayConfigRedux;
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
  [TOKIO_EVENTS.MUSIC_CHANGE]: MusicInfo[];
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
