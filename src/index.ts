import { EventLoader, TOKIO_EVENTS } from "./core";

const tokio = new EventLoader();

export { tokio, TOKIO_EVENTS };

export type {
  CloseData,
  ConfigData,
  CustomGift,
  ErrorData,
  EventMap,
  TokioPayload,
} from "./types";
export type {
  ChatData,
  Emotes,
  Fan,
  FansData,
  FollowData,
  GiftData,
  GiftersData,
  LikeData,
  MemberJoinData,
  MusicChangeData,
  MusicInfo,
  RoomUserData,
  ShareData,
  SuperFanData,
  SuperFanJoinData,
  TopGifter,
  UserData,
} from "./types/events";
