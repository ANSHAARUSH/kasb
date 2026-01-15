-- Allow users to update 'is_read' status for messages they received
create policy "Users can update read status of received messages"
on public.messages
for update
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);
