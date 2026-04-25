import React, { useState, useRef, useEffect } from 'react';
import { Send, Wand2, Edit3, Loader2, Check, X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNLEdit, type NLEditResult } from '@/lib/ai';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  result?: NLEditResult;
  isLoading?: boolean;
}

interface NLEditChatProps {
  currentCode: string;
  currentNodes: unknown[];
  onApplyEdit: (result: NLEditResult) => void;
  className?: string;
}

/**
 * Natural Language Edit Chat Interface
 * Builder.io-style chat editing
 */
export function NLEditChat({
  currentCode,
  currentNodes,
  onApplyEdit,
  className,
}: NLEditChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: 'Sayfayı düzenlemek için doğal dil komutları kullanabilirsiniz. Örnek: "Buttonu kırmızı yap", "Hero\'yu büyüt", "Yeni section ekle"',
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { edit, isEditing } = useNLEdit({
    onSuccess: (result) => {
      setMessages(prev => prev.map(msg => 
        msg.isLoading 
          ? { ...msg, isLoading: false, result, content: result.description }
          : msg
      ));
    },
    onError: (error) => {
      setMessages(prev => prev.map(msg => 
        msg.isLoading 
          ? { ...msg, isLoading: false, content: `Hata: ${error}` }
          : msg
      ));
    },
  });
  
  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim() || isEditing) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
    };
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Düzenleme yapılıyor...',
      isLoading: true,
    };
    
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    
    // Call AI edit
    await edit(input, { code: currentCode, nodes: currentNodes as any });
  };
  
  const handleApply = (msg: Message) => {
    if (msg.result) {
      onApplyEdit(msg.result);
    }
  };
  
  const quickCommands = [
    { icon: Edit3, label: 'Rengi değiştir', cmd: 'Buttonu mavi yap' },
    { icon: Wand2, label: 'Büyüt', cmd: 'Hero section daha büyük olsun' },
    { icon: Sparkles, label: 'Yeni ekle', cmd: 'Pricing section ekle' },
  ];
  
  return (
    <div className={cn("flex flex-col h-[500px] bg-white rounded-xl border border-slate-200", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
        <Wand2 className="w-5 h-5 text-purple-600" />
        <div>
          <h3 className="font-semibold text-slate-800">AI Edit</h3>
          <p className="text-xs text-slate-500">Doğal dil komutları ile düzenle</p>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  msg.type === 'user' && "bg-purple-600 text-white rounded-br-sm",
                  msg.type === 'ai' && "bg-slate-100 text-slate-800 rounded-bl-sm",
                  msg.type === 'system' && "bg-blue-50 text-blue-700 text-xs w-full"
                )}
              >
                {msg.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Düzenleniyor...</span>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Show reasoning if available */}
                    {msg.result?.reasoning && (
                      <details className="mt-2 text-xs opacity-70">
                        <summary className="cursor-pointer">AI nasıl düşündü?</summary>
                        <p className="mt-1 whitespace-pre-wrap">{msg.result.reasoning}</p>
                      </details>
                    )}
                    
                    {/* Apply button for successful edits */}
                    {msg.result?.success && !msg.isLoading && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApply(msg)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Uygula
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                        >
                          <X className="w-3 h-3 mr-1" />
                          İptal
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Quick Commands */}
      <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto">
        {quickCommands.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => setInput(cmd.cmd)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-600 whitespace-nowrap transition-colors"
          >
            <cmd.icon className="w-3 h-3" />
            {cmd.label}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Örn: Buttonu kırmızı yap, Heroyu büyüt"
            className="flex-1 px-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isEditing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isEditing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isEditing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
