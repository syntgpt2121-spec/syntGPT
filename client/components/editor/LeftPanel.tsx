import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, X, MoreVertical, Trash2, Square, Search, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ComponentNode } from "@/types/editor";
import type { PatchOperation } from "@/lib/builder/patch-engine";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { AI_PROMPT_TEMPLATES } from "@/lib/builder/templates";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  searchPerformed?: boolean;
  type?: 'chat' | 'component';
}

interface LeftPanelProps {
  tree: ComponentNode;
  onPatches: (patches: PatchOperation[], source?: 'user' | 'patch' | 'ai') => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function LeftPanel({ 
  tree,
  onPatches,
  isExpanded = false, 
  onToggleExpand
}: LeftPanelProps) {
  const [aiInput, setAiInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [chatHistory, setChatHistory] = useState<Array<{id: string, title: string, messages: ChatMessage[]}>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [streamProgress, setStreamProgress] = useState<{status: 'idle' | 'streaming' | 'completed' | 'error', message: string}>({status: 'idle', message: ''});

  const handleInsertReadyTemplate = useCallback(async (templateName: string, prompt: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setStreamProgress({ status: 'streaming', message: 'Şablon yükleniyor...' });
    try {
      // Import AI Orchestrator dynamically
      const { AIOrchestrator } = await import('@/lib/builder/ai-orchestrator');
      const orchestrator = new AIOrchestrator(); // No API key needed - uses server endpoint
      
      // Generate component using AI Orchestrator
      const result = await orchestrator.generateComponent(prompt);

      // Apply the generated tree
      onPatches([{ op: 'replaceTree', tree: result }], 'ai');
      setStreamProgress({ status: 'completed', message: 'Tamamlandı' });
      toast({ title: 'Template Applied', description: templateName });
    } catch (error: any) {
      console.error('[LeftPanel] Template error:', error);
      setStreamProgress({ status: 'error', message: 'Hata' });
      toast({ title: 'Template Failed', description: error?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onPatches]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Auto-focus input when component mounts or when showChat changes
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    // Focus immediately
    focusInput();
    
    // Also focus after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(focusInput, 100);
    
    return () => clearTimeout(timeoutId);
  }, [showChat]);

  // Auto-focus when user clicks anywhere on the panel
  const handlePanelClick = () => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  };

  // Load chat history from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("designChatHistory");
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }
  }, []);

  const handleSendMessage = async () => {
    if (!aiInput.trim() || isLoading) return;
    
    const userMessage = aiInput;
    setAiInput("");
    setIsLoading(true);
    
    if (!showChat) {
      setShowChat(true);
    }
    
    // Add user message
    const newMessages: ChatMessage[] = [...aiMessages, { role: 'user' as const, content: userMessage }];
    setAiMessages(newMessages);
    
    // Create or update chat in history
    let chatId = currentChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      setCurrentChatId(chatId);
      const chatTitle = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
      const newChat = {
        id: chatId,
        title: chatTitle,
        messages: newMessages
      };
      setChatHistory(prev => {
        const updated = [newChat, ...prev];
        localStorage.setItem("designChatHistory", JSON.stringify(updated));
        return updated;
      });
    } else {
      setChatHistory(prev => {
        const updated = prev.map(chat => 
          chat.id === chatId ? { ...chat, messages: newMessages } : chat
        );
        localStorage.setItem("designChatHistory", JSON.stringify(updated));
        return updated;
      });
    }
    
    try {
      setStreamProgress({ status: 'streaming', message: 'AI düşünüyor...' });
      
      // Call smart AI endpoint
      const response = await fetch('/api/groq/smart-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          messages: newMessages.slice(-10) // Son 10 mesajı gönder
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.action === 'component' || data.action === 'autonomous') {
        // ...
        // Component generation - Use AI Orchestrator
        setStreamProgress({ status: 'streaming', message: 'Component oluşturuluyor...' });
        
        try {
          // Import AI Orchestrator dynamically
          const { AIOrchestrator } = await import('@/lib/builder/ai-orchestrator');
          const orchestrator = new AIOrchestrator(); // No API key needed - uses server endpoint
          
          // Generate component using AI Orchestrator
          const result = await orchestrator.generateComponent(userMessage);

          // ...
          // Directly set the tree
          onPatches([{ op: 'replaceTree', tree: result }], 'ai');
          setStreamProgress({ status: 'completed', message: 'Tamamlandı' });
          
          // Use data.message if available, otherwise short success message
          const displayMessage = data.message || '✅ Site başarıyla oluşturuldu! Canvas\'ta görebilirsiniz.';
          
          const finalMessages: ChatMessage[] = [...newMessages, {
            role: 'assistant' as const,
            content: displayMessage,
            type: 'component'
          }];
          setAiMessages(finalMessages);
        } catch (orchestratorError: any) {
          console.error('[LeftPanel] AI Orchestrator error:', orchestratorError);
          throw new Error(`Component generation failed: ${orchestratorError.message}`);
        }

        // Generate explanation of what was created
        try {
          const explanationResponse = await fetch('/api/groq/smart-ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `Az önce "${userMessage}" isteği için component oluşturdun. Şimdi şunları açıkla:

🎯 **TAMAMLANAN İŞLER:**

1. **OLUŞTURDUKLARIM**: Hangi component'leri oluşturdun? Her birinin amacı ne?

2. **TASARIM KARARLARI**: Neden bu tasarım kararlarını aldın? Hangi prensipleri uyguladın?

3. **KULLANICI DENEYİMİ**: Kullanıcı bu tasarımla nasıl etkileşime geçecek?

4. **TEKNİK DETAYLAR**: Hangi teknolojileri ve yaklaşımları kullandın?

5. **GELİŞTİRME ÖNERİLERİ**: Bu tasarım nasıl daha da geliştirilebilir?

Kısa ve öz açıkla, maksimum 6-7 cümle. Emoji kullan.`,
              messages: []
            })
          });

          let explanationText = '✅ Component basariyla olusturuldu ve canvas\'a eklendi';
          
          if (explanationResponse.ok) {
            const explanationData = await explanationResponse.json();
            // Explanation cok uzunsa kisalt
            explanationText = explanationData.message 
              ? (explanationData.message.length > 500 
                  ? explanationData.message.substring(0, 500) + '...'
                  : explanationData.message)
              : explanationText;
          }

          const finalMessages: ChatMessage[] = [...newMessages, {
            role: 'assistant' as const,
            content: explanationText.length > 300 ? explanationText.substring(0, 300) + '...' : explanationText,
            type: 'component'
          }];
          setAiMessages(finalMessages);

          setChatHistory(prev => {
            const updated = prev.map(chat =>
              chat.id === chatId ? { ...chat, messages: finalMessages } : chat
            );
            localStorage.setItem("designChatHistory", JSON.stringify(updated));
            return updated;
          });

        } catch (error) {
          console.error('[LeftPanel] Explanation error:', error);
          
          const finalMessages: ChatMessage[] = [...newMessages, {
            role: 'assistant' as const,
            content: '✅ Component basariyla olusturuldu ve canvas\'a eklendi',
            type: 'component'
          }];
          setAiMessages(finalMessages);

          setChatHistory(prev => {
            const updated = prev.map(chat =>
              chat.id === chatId ? { ...chat, messages: finalMessages } : chat
            );
            localStorage.setItem("designChatHistory", JSON.stringify(updated));
            return updated;
          });
        }
      } else {
        // Chat or web search response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
          sources: data.sources,
          searchPerformed: data.searchPerformed,
          type: data.action === 'web_search' ? 'chat' : 'chat'
        };

        const finalMessages = [...newMessages, assistantMessage];
        setAiMessages(finalMessages);

        setChatHistory(prev => {
          const updated = prev.map(chat =>
            chat.id === chatId ? { ...chat, messages: finalMessages } : chat
          );
          localStorage.setItem("designChatHistory", JSON.stringify(updated));
          return updated;
        });

        setStreamProgress({ status: 'completed', message: 'Tamamlandı' });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setStreamProgress({ status: 'idle', message: 'İptal edildi' });
      } else {
        console.error('[LeftPanel] AI error:', error);
        setStreamProgress({ status: 'error', message: 'Hata' });
        
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Üzgünüm, bir hata oluştu: ${error.message}`,
          type: 'chat'
        };
        
        const finalMessages = [...newMessages, errorMessage];
        setAiMessages(finalMessages);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };


  const handleCancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStreamProgress({ status: 'idle', message: 'İptal edildi' });
      setIsLoading(false);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);
    localStorage.setItem("designChatHistory", JSON.stringify(updatedHistory));
    
    if (currentChatId === chatId) {
      setAiMessages([]);
      setCurrentChatId(null);
    }
    
    setOpenMenuChatId(null);
    toast({ title: "Chat Deleted", description: "Chat has been deleted successfully" });
  };

  return (
    <div 
      className="h-full bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-300" 
      onClick={(e) => {
        e.stopPropagation();
        onToggleExpand?.();
        handlePanelClick();
      }}
    >
      {showChat ? (
        /* Chat View */
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('chat');
                }}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === 'chat' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('history');
                }}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === 'history' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                History
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowChat(false);
              }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 py-4">
            {activeTab === 'chat' && (
              <div className="space-y-6">
                {aiMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">Akıllı AI</span>
                    </div>
                    <div className="text-xs text-muted-foreground max-w-48">
                      Soru sor, component iste veya web araştırması yap - AI kendisi karar verir
                    </div>
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div key={idx} className="space-y-2 overflow-hidden">
                      {msg.role === 'user' ? (
                        <div className={`flex justify-end ${idx === 0 ? 'pt-16' : ''}`}>
                          <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-muted text-foreground text-sm break-words overflow-wrap-anywhere overflow-hidden">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 max-w-[95%] overflow-hidden chat-message">
                          {/* Message type indicator */}
                          {msg.type === 'component' && (
                            <div className="flex items-center gap-2 text-xs text-green-500">
                              <Square className="w-3 h-3" />
                              <span>Component Generated</span>
                            </div>
                          )}
                          {msg.searchPerformed && (
                            <div className="flex items-center gap-2 text-xs text-blue-500">
                              <Search className="w-3 h-3" />
                              <span>Web arastirmasi yapildi</span>
                            </div>
                          )}
                          
                          {/* Message content */}
                          <div className="text-sm text-foreground leading-relaxed break-words overflow-wrap-anywhere overflow-hidden min-w-0 chat-message">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2 border-b border-border pb-1" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-base font-semibold text-foreground mt-3 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-medium text-muted-foreground mt-2 mb-1" {...props} />,
                                p: ({node, ...props}) => <p className="text-foreground text-sm leading-relaxed my-2 break-words" {...props} />,
                                ul: ({node, ...props}) => <ul className="space-y-1 my-2 text-sm pl-4 list-disc break-words" {...props} />,
                                ol: ({node, ...props}) => <ol className="space-y-1 my-2 text-sm pl-4 list-decimal break-words" {...props} />,
                                li: ({node, ...props}) => <li className="text-sm leading-relaxed break-words" {...props} />,
                                code: ({node, inline, ...props}: any) => (
                                  inline ? (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary break-all" {...props} />
                                  ) : (
                                    <code className="block bg-muted p-2 rounded-lg overflow-x-auto text-xs font-mono my-2 max-w-full whitespace-pre border border-border" {...props} />
                                  )
                                ),
                                pre: ({node, ...props}) => <pre className="bg-muted rounded-lg overflow-hidden my-2 max-w-full overflow-x-auto p-0 border border-border" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-muted-foreground" {...props} />,
                                a: ({node, ...props}) => <a className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                                table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full text-xs border-collapse" {...props} /></div>,
                                thead: ({node, ...props}) => <thead className="bg-muted" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="divide-y divide-border" {...props} />,
                                th: ({node, ...props}) => <th className="px-2 py-1 text-left text-xs font-medium border-b border-border" {...props} />,
                                td: ({node, ...props}) => <td className="px-2 py-1 text-xs border-b border-border" {...props} />,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          
                          {/* Sources */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="space-y-2 mt-3">
                              <div className="text-xs font-medium text-muted-foreground">Kaynaklar:</div>
                              {msg.sources.map((source, sourceIdx) => (
                                <div key={sourceIdx} className="bg-muted/50 rounded-lg p-3 space-y-1">
                                  <a 
                                    href={source.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium text-primary hover:underline block"
                                  >
                                    {source.title}
                                  </a>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {source.snippet}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            
            {activeTab === 'history' && (
              <div className="space-y-2">
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className="group relative flex items-center gap-1 px-1.5 py-1.5 rounded-lg bg-muted hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentChatId(chat.id);
                          setAiMessages(chat.messages);
                          setActiveTab('chat');
                        }}
                        className="flex-1 min-w-0"
                      >
                        <div className="text-xs text-foreground truncate">{chat.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{chat.messages.length} messages</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 w-5 h-5 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
                        }}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                      
                      {/* Dropdown Menu */}
                      {openMenuChatId === chat.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-soft-md z-50 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDeleteChat(chat.id)}
                            className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-accent flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Henüz geçmiş yok
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          {activeTab === 'chat' && (
            <div className="border-t border-border p-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Soru sor, component iste veya araştırma yap..."
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-3 text-sm bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLoading && abortControllerRef.current) {
                        handleCancelStream();
                      } else {
                        handleSendMessage();
                      }
                    }}
                    disabled={!isLoading && !aiInput.trim()}
                    className="h-8 w-8 px-0 bg-primary hover:bg-primary/90 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {streamProgress.status !== 'idle' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {streamProgress.message}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Default View - Chat & History Only */
        <div className="h-full flex flex-col">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('chat');
                  setShowChat(true);
                }}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === 'chat' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('history');
                  setShowChat(true);
                }}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === 'history' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="text-center space-y-2 pb-4">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-base font-medium">AI Visual Builder</span>
                    </div>
                    <div className="text-xs text-muted-foreground max-w-64 mx-auto">
                      Builder.io tarzında site oluştur - AI otomatik component tree üretir
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground px-1">Hazır Şablonlar:</div>
                    <div className="grid gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertReadyTemplate('Haber Sitesi', 'Modern bir haber sitesi yap. Navbar + hero + 3 kolon haber kartları + kategori bölümü + footer.');
                        }}
                        className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 hover:border-primary/30"
                        disabled={isLoading}
                      >
                        <div className="text-xs font-medium text-foreground">Haber Sitesi</div>
                        <div className="text-xs text-muted-foreground mt-1">Grid + kartlar + footer</div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertReadyTemplate('E-Ticaret', 'Modern bir e-ticaret landing yap. Üstte navbar, hero, ürün grid (4 ürün), kampanya bandı, müşteri yorumları, footer.');
                        }}
                        className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 hover:border-primary/30"
                        disabled={isLoading}
                      >
                        <div className="text-xs font-medium text-foreground">E-Ticaret</div>
                        <div className="text-xs text-muted-foreground mt-1">Ürün grid + kampanya</div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertReadyTemplate('SaaS Landing', 'Modern bir SaaS landing yap. Hero + özellikler + fiyatlandırma + CTA + footer.');
                        }}
                        className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 hover:border-primary/30"
                        disabled={isLoading}
                      >
                        <div className="text-xs font-medium text-foreground">SaaS Landing</div>
                        <div className="text-xs text-muted-foreground mt-1">Feature + pricing + CTA</div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertReadyTemplate('Portfolio', 'Modern bir portfolio sayfası yap. Hero + proje kartları + yetenekler + iletişim + footer.');
                        }}
                        className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 hover:border-primary/30"
                        disabled={isLoading}
                      >
                        <div className="text-xs font-medium text-foreground">Portfolio</div>
                        <div className="text-xs text-muted-foreground mt-1">Projeler + iletişim</div>
                      </button>
                    </div>
                  </div>

                  {/* Template Examples */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground px-1">Örnek Promptlar:</div>
                    <div className="grid gap-2">
                      {AI_PROMPT_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiInput(template.prompt);
                            if (inputRef.current) {
                              inputRef.current.focus();
                            }
                          }}
                          className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 hover:border-primary/30 group"
                        >
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                                {template.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.prompt.slice(0, 60)}...
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-medium text-primary">💡 Nasıl Çalışır?</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• İstediğin sayfayı tarif et</li>
                      <li>• AI otomatik component tree oluşturur</li>
                      <li>• Canvas'ta anında görüntüle</li>
                      <li>• AI'a değişiklik isteği yap</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>

              {/* AI Assistant Input */}
              <div className="border-t border-border/60 bg-card/70 backdrop-blur-sm p-4 pb-5">
                <div className="relative">
                  <input
                    ref={inputRef}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Soru sor, component iste veya araştırma yap..."
                    disabled={isLoading}
                    className="w-full pl-4 pr-12 py-3 text-sm bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLoading && abortControllerRef.current) {
                          handleCancelStream();
                        } else {
                          handleSendMessage();
                        }
                      }}
                      disabled={!isLoading && !aiInput.trim()}
                      className="h-8 w-8 px-0 bg-primary hover:bg-primary/90 rounded-lg shadow-soft-sm transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          </div>
        </div>
      )}
    </div>
  );
}
