// @/services/chatService.ts
import api from "./api";

export interface MessageAttachment {
  id: number | string;
  path: string;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface Message {
  id: number | string;
  conversation_id: number;
  sender_id: number;
  body: string | null;
  created_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
  attachments?: MessageAttachment[];
}

export interface Participant {
  id: number | string;
  user_id: number;
  role: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface ConversationData {
  id: number;
  status: string;
  messages: Message[];
  participants: Participant[];
}

/**
 * Fetch a conversation by its ID
 */
export const getConversation = async (
  conversationId: string | number,
): Promise<ConversationData> => {
  const res = await api.get(`/conversations/${conversationId}`);
  return res.data;
};

/**
 * Send a new message to an active conversation
 */
export const sendMessage = async (
  conversationId: string | number,
  payload: FormData | { body: string },
): Promise<Message> => {
  const isFormData = payload instanceof FormData;
  const res = await api.post(
    `/conversations/${conversationId}/messages`,
    payload,
    {
      headers: {
        "Content-Type": isFormData ? "multipart/form-data" : "application/json",
      },
    },
  );
  return res.data.data;
};

/**
 * Mark all messages inside the conversation as read
 */
export const markConversationAsRead = async (
  conversationId: string | number,
): Promise<{ status: string }> => {
  const res = await api.post(`/conversations/${conversationId}/read`);
  return res.data;
};
