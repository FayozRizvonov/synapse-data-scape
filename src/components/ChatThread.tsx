import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type RowMessage = { id: string; content: string; sender: 'user'|'ai'|'system'; created_at: string };

const PAGE_SIZE = 50;

const ChatThread: React.FC = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState<RowMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const anchorRef = useRef<HTMLDivElement>(null);

  const fromAny = (supabase as unknown as { from: (t: string) => any }).from;

  const loadPage = async (olderThan?: string) => {
    if (!id || loading) return;
    setLoading(true);
    let query = fromAny('messages')
      .select('id, content, sender, created_at')
      .eq('chat_id', id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (olderThan) query = query.lt('created_at', olderThan);
    const { data } = await query;
    const rows = (data as RowMessage[]) || [];
    setHasMore(rows.length === PAGE_SIZE);
    // prepend older, maintain ascending order for render
    setMessages(prev => {
      const merged = [...rows.reverse(), ...prev];
      return merged;
    });
    setLoading(false);
  };

  useEffect(() => {
    setMessages([]);
    if (id) loadPage();
    // realtime new messages
    const channel = (supabase as any).channel('chat-thread:' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` }, (payload: any) => {
        const m = payload.new as RowMessage;
        setMessages(prev => [...prev, m]);
        // scroll to bottom on new
        setTimeout(() => anchorRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOlder = () => {
    if (!messages.length) return;
    loadPage(messages[0].created_at);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">Chat</h1>
        <Button variant="outline" onClick={loadOlder} disabled={!hasMore || loading}>Load older</Button>
      </div>
      <div className="space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`rounded-lg px-3 py-2 border ${m.sender === 'user' ? 'self-end bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
            <div className="text-xs text-muted-foreground mb-1">{m.sender} • {new Date(m.created_at).toLocaleString()}</div>
            <div className="text-sm text-foreground whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        <div ref={anchorRef} />
      </div>
    </div>
  );
};

export default ChatThread;


