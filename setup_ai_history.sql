-- Create the AI Chat Sessions table
create table if not exists ai_chat_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    personality_id text not null, -- e.g., "Melon Tusk"
    title text not null default 'New Chat',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: We add an index to user_id to speed up sidebar loading
create index if not exists ai_chat_sessions_user_id_idx on ai_chat_sessions(user_id);

-- Create the AI Chat Messages table
create table if not exists ai_chat_messages (
    id uuid default gen_random_uuid() primary key,
    session_id uuid references ai_chat_sessions(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists ai_chat_messages_session_id_idx on ai_chat_messages(session_id);

-- Set up Row Level Security (RLS) to ensure users can only see their own chats
alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;

-- Policies for sessions
create policy "Users can view their own chat sessions"
    on ai_chat_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions"
    on ai_chat_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions"
    on ai_chat_sessions for update
    using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions"
    on ai_chat_sessions for delete
    using (auth.uid() = user_id);

-- Policies for messages
create policy "Users can view messages of their sessions"
    on ai_chat_messages for select
    using (
        exists (
            select 1 from ai_chat_sessions
            where ai_chat_sessions.id = ai_chat_messages.session_id
            and ai_chat_sessions.user_id = auth.uid()
        )
    );

create policy "Users can insert messages into their sessions"
    on ai_chat_messages for insert
    with check (
        exists (
            select 1 from ai_chat_sessions
            where ai_chat_sessions.id = ai_chat_messages.session_id
            and ai_chat_sessions.user_id = auth.uid()
        )
    );

create policy "Users can update messages of their sessions"
    on ai_chat_messages for update
    using (
        exists (
            select 1 from ai_chat_sessions
            where ai_chat_sessions.id = ai_chat_messages.session_id
            and ai_chat_sessions.user_id = auth.uid()
        )
    );

create policy "Users can delete messages of their sessions"
    on ai_chat_messages for delete
    using (
        exists (
            select 1 from ai_chat_sessions
            where ai_chat_sessions.id = ai_chat_messages.session_id
            and ai_chat_sessions.user_id = auth.uid()
        )
    );
