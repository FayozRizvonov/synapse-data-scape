import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type RowMessage = { id: string; content: string; sender: 'user'|'ai'|'system'; created_at: string };

const PAGE_SIZE = 50;

const ChatThread: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<RowMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // `supabase.from` must stay bound to the client. Taking it off and calling it
  // detached throws `Cannot read properties of undefined (reading 'rest')` on every
  // call, because `this.rest` is gone — the same bug that kept `chats` and `messages`
  // empty until #20 fixed it in useAIAssistant. This file was missed.
  const loadPage = async (olderThan?: string) => {
    if (!id || loading) return;
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select('id, content, sender, created_at')
        .eq('chat_id', id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (olderThan) query = query.lt('created_at', olderThan);

      const { data, error: queryErr } = await query;
      if (queryErr) throw queryErr;

      const rows = (data as RowMessage[]) || [];
      setHasMore(rows.length === PAGE_SIZE);
      // prepend older, maintain ascending order for render
      setMessages(prev => [...rows.reverse(), ...prev]);
      setError(null);
    } catch (err: any) {
      // A failure used to leave `loading` true for good, which disabled "Load older"
      // and left the view silently empty. Say so instead.
      console.error('Loading this conversation failed:', err);
      setError(err?.message || String(err));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
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

  // This route renders outside the dashboard shell — GlobalLayout gives it only a
  // UserButton — so without this the browser's own back button was the only way out.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');                      // a deep link has no in-app history
  };

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goBack} aria-label="Back to chat history">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Chat</h1>
        </div>
        <Button variant="outline" onClick={loadOlder} disabled={!hasMore || loading}>Load older</Button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          Could not load this conversation: {error}
        </div>
      )}
      {!error && !loading && !messages.length && (
        <div className="mb-4 text-sm text-muted-foreground">No messages in this conversation yet.</div>
      )}
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


