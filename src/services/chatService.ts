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
  conversation: {
    id: number;
    status: string;
    participants: Participant[];
  };
  messages: Message[];
  pagination: {
    current_page: number;
    last_page: number;
    has_more: boolean;
  };
}

/**
 * Fetch a conversation by its ID with pagination support
 * @param conversationId - The conversation ID
 * @param page - Page number (1 = newest messages, 2+ = older messages)
 * @returns Paginated conversation data
 */
export const getConversation = async (
  conversationId: string | number,
  page: number = 1,
): Promise<ConversationData> => {
  const res = await api.get(`/conversations/${conversationId}`, {
    params: { page },
  });

  const data = res.data as ConversationData;

  // Ensure messages are sorted by timestamp (oldest first for display)
  if (data.messages && Array.isArray(data.messages)) {
    data.messages.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  return data;
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
  return res.data;
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
