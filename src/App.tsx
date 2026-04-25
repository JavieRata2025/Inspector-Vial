import {useState, useEffect, useRef} from 'react';
import {Send, BrainCircuit, AlertTriangle, ShieldCheck} from 'lucide-react';

type Message = {role: 'user' | 'model'; content: string};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([{role: 'model', content: '¡Hola! Soy tu Inspector Vial. ¿En qué calle o plaza vas a empezar la auditoría hoy?'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight, behavior: 'smooth'});
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, {role: 'user' as const, content: input}];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({messages: newMessages}),
      });
      if (!resp.ok) throw new Error('Interferencias en la red temporalmente...');
      const data = await resp.json();
      setMessages([...newMessages, {role: 'model', content: data.reply}]);
    } catch (err) {
      setMessages([...newMessages, {role: 'model', content: '⚠️ Interferencias en la red temporalmente...'}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-100 text-zinc-900 font-sans p-6 overflow-hidden">
      <header className="bg-amber-400 border-4 border-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 mb-4">
        <ShieldCheck className="w-12 h-12 text-zinc-900" />
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Inspector<br/>Vial Pro</h1>
      </header>
      
      <div className="flex-1 bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'model' && (
                <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center shrink-0">
                  <span className="text-amber-400 font-bold uppercase text-xs">IV</span>
                </div>
              )}
              <div className={`p-4 border-2 border-zinc-900 max-w-[80%] font-medium ${m.role === 'user' ? 'bg-amber-100 order-1' : 'bg-zinc-100 order-2'}`}>
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-10 h-10 bg-amber-400 border-2 border-zinc-900 flex items-center justify-center shrink-0 font-black text-xs order-3">TÚ</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center shrink-0"></div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-zinc-900 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-zinc-900 rounded-full animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-zinc-900 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t-4 border-zinc-900 p-4 bg-zinc-50 flex gap-4">
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-white border-2 border-zinc-900 p-3 font-bold text-sm focus:outline-none focus:border-amber-400"
            placeholder="Escribe tu observación aquí..."
          />
          <button onClick={sendMessage} disabled={loading} className="bg-zinc-900 text-white px-8 font-black uppercase text-sm tracking-widest hover:bg-zinc-700">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
