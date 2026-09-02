interface UserData {
  username: string;
  handle: string;
  profilePictures: string[];
  superfan?: boolean;
  follower?: boolean;
  moderator?: boolean;
  fanLevel?: number;
}

export interface ChatEvent {
  user: UserData;
  comment: {
    content: string;
    emotes: Emotes[];
    lang: string;
  };
}

export type RoomUserEvent = {
  ranks: (UserData & { score: number; position: number })[];
  views: number;
  viewers: number;
};

export interface Emotes {
  emoteID: string;
  index: number;
  images: string[];
}

export interface ShareEvent {
  shareCount: number;
  user: UserData;
}

interface SingleUserEvent {
  user: UserData;
}

export type FollowEvent = SingleUserEvent;

export type SuperFanEvent = SingleUserEvent;

export type MemberEvent = SingleUserEvent;

export type SuperFanJoinEvent = SingleUserEvent;

export interface GiftEvent {
  user: UserData;
  gift: {
    id: string;
    coins: number;
    repeatEnd: boolean;
    type: number;
    name: string;
    comboCount: number;
  };
}

export interface LikeEvent {
  user: UserData;
  likeCount: number;
  totalLikes: number;
}
