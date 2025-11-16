// src/types/api.ts

export type User = {
  id: number;
  email: string;
  username: string;
  radiusKm: number;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type Event = {
  id: number;
  title: string;
  description: string;
  type: string;
  date: string;
  latitude: number;
  longitude: number;
  address?: string | null;
};

export type EventParticipant = {
  id: number;
  userId: number;
};

export type EventWithDetails = Event & {
  creator?: User;
  participants?: {
    id: number;
    userId: number;
    user?: User;
  }[];
};

export type ChatMessage = {
  id: number;
  text: string;
  createdAt: string;
  eventId: number;
  sender: {
    id: number;
    username: string;
  };
};
