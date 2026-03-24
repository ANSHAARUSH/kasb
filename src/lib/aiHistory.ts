import { supabase } from './supabase';

export interface ChatSession {
    id: string;
    user_id: string;
    personality_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

/**
 * Fetch all chat sessions for a given user, ordered by most recently updated
 */
export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching chat sessions:", error);
        return [];
    }
    return data as ChatSession[];
}

/**
 * Fetch all messages for a specific chat session, ordered chronologically
 */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching chat messages:", error);
        return [];
    }
    return data as ChatMessage[];
}

/**
 * Create a new chat session when the user sends their very first message
 */
export async function createChatSession(
    userId: string,
    personalityId: string,
    initialMessage: string
): Promise<ChatSession | null> {
    // Generate a quick title from the first 5 words of the initial message
    const titleWords = initialMessage.split(/\s+/).slice(0, 5).join(' ');
    const title = titleWords.length < initialMessage.length ? `${titleWords}...` : titleWords;

    const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
            user_id: userId,
            personality_id: personalityId,
            title: title || 'New Chat'
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating chat session:", error);
        return null;
    }
    return data as ChatSession;
}

/**
 * Save a single chat message (either from the user or the assistant) to the database
 */
export async function saveChatMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
): Promise<ChatMessage | null> {
    // Insert the message
    const { data, error } = await supabase
        .from('ai_chat_messages')
        .insert({
            session_id: sessionId,
            role,
            content
        })
        .select()
        .single();

    if (error) {
        console.error(`Error saving ${role} message:`, error);
        return null;
    }

    // Update the session's updated_at timestamp so it jumps to the top of the sidebar
    await supabase
        .from('ai_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    return data as ChatMessage;
}

/**
 * Delete an entire chat session (messages are deleted automatically via ON DELETE CASCADE in SQL)
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error("Error deleting chat session:", error);
        return false;
    }
    return true;
}
