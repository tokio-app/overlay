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
  ChatTranslation,
  CheerData,
  Emotes,
  Fan,
  FansData,
  FollowData,
  GiftData,
  GiftersData,
  GiftSubData,
  KicksData,
  LikeData,
  MemberJoinData,
  MusicChangeData,
  MusicInfo,
  RaidData,
  RedeemData,
  RoomUserData,
  ShareData,
  SubscribeData,
  SuperChatData,
  SuperFanData,
  SuperFanJoinData,
  TopGifter,
  UserData,
} from "./types/events";
