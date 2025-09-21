import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

type Chat = {
  id: string;
  title: string;
  persona: string | null;
  updated_at: string;
};

interface ChatHistoryProps {
  onOpenChat?: (chatId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onOpenChat }) => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  const loadChats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chats')
      .select('id, title, persona, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (!error && data) setChats(data as Chat[]);
    setLoading(false);
  };

  useEffect(() => { loadChats(); }, []);

  const createChat = async () => {
    const { data, error } = await supabase
      .from('chats')
      .insert({ title: 'New chat' })
      .select('id, title, persona, updated_at')
      .single();
    if (!error && data) setChats(prev => [data as Chat, ...prev]);
  };

  const deleteChat = async (id: string) => {
    await supabase.from('chats').delete().eq('id', id);
    setChats(prev => prev.filter(c => c.id !== id));
  };

  const startRename = (chat: Chat) => {
    setEditingId(chat.id);
    setTitleDraft(chat.title);
  };

  const saveRename = async (id: string) => {
    await supabase.from('chats').update({ title: titleDraft }).eq('id', id);
    setChats(prev => prev.map(c => (c.id === id ? { ...c, title: titleDraft } : c)));
    setEditingId(null);
  };

  const cancelRename = () => { setEditingId(null); };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
        <Button onClick={createChat} variant="outline" className="gap-2"><Plus className="w-4 h-4"/>New</Button>
      </div>
      <div className="space-y-2">
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && chats.length === 0 && (
          <div className="text-sm text-muted-foreground">No chats yet. Create your first conversation.</div>
        )}
        {chats.map(chat => (
          <div key={chat.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex-1 mr-3">
              {editingId === chat.id ? (
                <Input value={titleDraft} onChange={e => setTitleDraft(e.target.value)} className="h-8" />
              ) : (
                <button onClick={() => (onOpenChat ? onOpenChat(chat.id) : navigate(`/chat/${chat.id}`))} className="text-left w-full">
                  <div className="text-sm font-medium text-foreground truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">Updated {new Date(chat.updated_at).toLocaleString()}</div>
                </button>
              )}
            </div>
            {editingId === chat.id ? (
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => saveRename(chat.id)}><Check className="w-4 h-4"/></Button>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={cancelRename}><X className="w-4 h-4"/></Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => startRename(chat)}><Pencil className="w-4 h-4"/></Button>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => deleteChat(chat.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;


