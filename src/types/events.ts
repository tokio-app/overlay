export interface UserData {
  username: string;
  handle: string;
  profilePictures: string[];
  superfan?: boolean;
  follower?: boolean;
  moderator?: boolean;
  fanLevel?: number;
}

export interface ChatData {
  user: UserData;
  comment: {
    content: string;
    emotes: Emotes[];
    lang: string;
  };
}

export type RoomUserData = {
  ranks: (UserData & { score: number; position: number })[];
  views: number;
  viewers: number;
};

export interface Emotes {
  emoteID: string;
  index: number;
  images: string[];
}

export interface ShareData {
  shareCount: number;
  user: UserData;
}

interface SingleUserData {
  user: UserData;
}

export type FollowData = SingleUserData;

export type SuperFanData = SingleUserData;

export type MemberJoinData = SingleUserData;

export type SuperFanJoinData = SingleUserData;

export interface GiftData {
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

export interface LikeData {
  user: UserData;
  likeCount: number;
  totalLikes: number;
}

export type MusicInfo = {
  title: string;
  thumbnail: string;
  playing: boolean;
  played: boolean;
};

// The whole music request queue.
export type MusicChangeData = MusicInfo[];
