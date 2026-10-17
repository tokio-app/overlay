import {
  ChatData,
  FollowData,
  GiftData,
  LikeData,
  MemberJoinData,
  MusicChangeData,
  RoomUserData,
  ShareData,
  SuperFanData,
  SuperFanJoinData,
} from "./events";

export type CustomGift = {
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

export type ConfigData = {
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
  [TOKIO_EVENTS.ERROR]: ErrorData;
  [TOKIO_EVENTS.CLOSE]: CloseData;
  [TOKIO_EVENTS.CONFIG]: ConfigData;
  [TOKIO_EVENTS.CHAT]: ChatData;
  [TOKIO_EVENTS.SHARE]: ShareData;
  [TOKIO_EVENTS.FOLLOW]: FollowData;
  [TOKIO_EVENTS.GIFT]: GiftData;
  [TOKIO_EVENTS.LIKE]: LikeData;
  [TOKIO_EVENTS.ENVELOPE]: void;
  [TOKIO_EVENTS.SUPER_FAN_BOX]: void;
  [TOKIO_EVENTS.SUPER_FAN]: SuperFanData;
  [TOKIO_EVENTS.MEMBER_JOIN]: MemberJoinData;
  [TOKIO_EVENTS.SUPER_FAN_JOIN]: SuperFanJoinData;
  [TOKIO_EVENTS.ROOM_USER]: RoomUserData;
  [TOKIO_EVENTS.MUSIC_CHANGE]: MusicChangeData;
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

export interface ErrorData {
  message?: string;
  type: string;
  error?: Error;
}

export interface CloseData {
  code: number;
  reason: string;
  wasClean: boolean;
}

export type Subscribers = {
  [K in TOKIO_EVENTS]?: Set<(payload: EventMap[K]) => void>;
};
