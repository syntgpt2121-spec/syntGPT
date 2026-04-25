import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Upload, Trash2, User, Send, Crown, MessageCircle, Mail, BookOpen, CreditCard, Square, Pencil, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

// AI Response Component with Professional Reasoning Display
function AIResponse({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const [showThinking, setShowThinking] = useState(true);
  const [copiedBlockKey, setCopiedBlockKey] = useState<string | null>(null);
  
  // Parse thinking tags
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
  const thinking = thinkingMatch ? thinkingMatch[1].trim() : null;
  
  // Check if we're currently typing in the thinking section
  const isTypingThinking = content.includes('<thinking>') && !content.includes('</thinking>');
  
  // Get the current thinking content while typing
  let currentThinking = isTypingThinking ? content.replace('<thinking>', '').trim() : thinking;
  
  // Remove numbering/ordering from thinking content
  if (currentThinking) {
    currentThinking = currentThinking
      .replace(/^\d+\.\s*/gm, '') // Remove "1. ", "2. " etc at start of lines
      .replace(/^-\s*/gm, '') // Remove "- " at start of lines
      .replace(/^\*\s*/gm, '') // Remove "* " at start of lines
      .replace(/^Step\s+\d+:\s*/gmi, '') // Remove "Step 1:", "Step 2:" etc
      .replace(/^Phase\s+\d+:\s*/gmi, '') // Remove "Phase 1:", "Phase 2:" etc
      .replace(/^First,?\s*/gmi, '') // Remove "First," or "First"
      .replace(/^Second,?\s*/gmi, '') // Remove "Second," or "Second"
      .replace(/^Third,?\s*/gmi, '') // Remove "Third," or "Third"
      .replace(/^Next,?\s*/gmi, '') // Remove "Next," or "Next"
      .replace(/^Then,?\s*/gmi, '') // Remove "Then," or "Then"
      .replace(/^Finally,?\s*/gmi, ''); // Remove "Finally," or "Finally"
  }
  
  // Auto-collapse thinking when it reaches halfway point (estimated)
  const shouldAutoCollapse = currentThinking && currentThinking.length > 200 && !isTypingThinking;
  if (shouldAutoCollapse && showThinking) {
    setTimeout(() => setShowThinking(false), 1000); // Auto-collapse after 1 second
  }
  
  // Remove ALL thinking content from answer (both complete and incomplete thinking tags)
  let answer = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
  if (isTypingThinking) {
    // If we're still typing thinking, remove the incomplete thinking tag and its content
    answer = content.replace(/<thinking>[\s\S]*$/, '').trim();
  }

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      // ignore
    }
  };

  let codeBlockIndex = 0;

  return (
    <div className="space-y-4">
      {(thinking || isTypingThinking) && (
        <div className="border-l-2 border-gray-700 pl-4">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showThinking ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Thinking Process</span>
          </button>
          {showThinking && (
            <div className="py-2">
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap opacity-70">
                {currentThinking}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="prose prose-invert max-w-none">
        {isStreaming && !answer && !thinking && !isTypingThinking ? (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
        ) : answer ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({node, ...props}) => (
                <p className="text-gray-100 text-[15px] leading-[1.8] mb-4 last:mb-0" {...props} />
              ),
              h1: ({node, ...props}) => (
                <h1 className="text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b border-gray-700" {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 className="text-xl font-semibold text-white mt-5 mb-3" {...props} />
              ),
              h3: ({node, ...props}) => (
                <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside space-y-1 mb-4 text-gray-100" {...props} />
              ),
              ol: ({node, ...props}) => (
                <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-100" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="text-[15px] leading-relaxed" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="text-gray-200 font-medium" {...props} />
              ),
              a: ({node, ...props}) => (
                <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
              ),
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4" {...props} />
              ),
              hr: ({node, ...props}) => (
                <hr className="border-gray-700 my-6" {...props} />
              ),
              pre: ({node, children, ...props}) => {
                const renderKey = `codeblock_${codeBlockIndex++}`;

                return (
                  <div className="relative my-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async (e) => {
                        const container = (e.currentTarget.parentElement as HTMLElement | null);
                        const codeEl = container?.querySelector('pre code') as HTMLElement | null;
                        const text = (codeEl?.textContent ?? '').trimEnd();
                        if (!text) return;

                        await copyText(text);

                        setCopiedBlockKey(renderKey);
                        setTimeout(() => setCopiedBlockKey((prev) => (prev === renderKey ? null : prev)), 1200);
                      }}
                      className="absolute right-2 top-2 h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-transparent border border-transparent hover:border-transparent"
                      aria-label="Kodu kopyala"
                    >
                      {copiedBlockKey === renderKey ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                    <pre
                      className="bg-[#0d0d0d] rounded-xl overflow-x-auto border border-gray-800 p-4 pt-10"
                      {...props}
                    >
                      {children}
                    </pre>
                  </div>
                );
              },
              code: ({node, inline, className, ...props}: any) => (
                inline ? (
                  <code className="bg-[#1b1b1b] px-1.5 py-0.5 rounded text-[13px] font-mono text-green-300 border border-[#2a2a2a]" {...props} />
                ) : (
                  <code className={`text-[13px] font-mono text-green-200 leading-relaxed ${className || ''}`} {...props} />
                )
              ),
              table: ({node, ...props}) => (
                <div className="my-4 overflow-x-auto rounded-xl border border-[#2a2a2a]">
                  <table className="w-full text-left border-collapse" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => (
                <thead className="bg-[#151515]" {...props} />
              ),
              tbody: ({node, ...props}) => (
                <tbody className="bg-[#101010]" {...props} />
              ),
              tr: ({node, ...props}) => (
                <tr className="border-b border-[#242424] last:border-b-0" {...props} />
              ),
              th: ({node, ...props}) => (
                <th className="px-3 py-2 text-xs font-semibold text-gray-200" {...props} />
              ),
              td: ({node, ...props}) => (
                <td className="px-3 py-2 text-sm text-gray-100 align-top" {...props} />
              ),
            }}
          >
            {answer}
          </ReactMarkdown>
        ) : null}
      </div>
    </div>
  );
}

 export default function Chat() {
  const navigate = useNavigate();
  type ChatMessage = { role: 'user' | 'assistant'; content: string; imageDataUrl?: string };
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; name: string; type: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{id: string, title: string, messages: Array<{role: 'user' | 'assistant', content: string}>}>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'normal' | 'thinking' | 'fast'>('normal');
  const [showInputModeMenu, setShowInputModeMenu] = useState(false);
  const [userName, setUserName] = useState<string>("Kullanıcı");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [shouldLiftInput, setShouldLiftInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorMessageIndex, setErrorMessageIndex] = useState<number | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [copiedUserMessageIndex, setCopiedUserMessageIndex] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      // ignore
    }
  };

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = '0px';
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 400);
    el.style.height = `${next}px`;
  };

  useLayoutEffect(() => {
    resizeInput();
  }, [aiInput, shouldLiftInput]);

  // Get current user email for user-specific storage
  const userEmail = localStorage.getItem("userEmail") || "default";
  const storageKey = (key: string) => `${key}_${userEmail}`;
  const MESSAGE_LIMIT = 5;

  const deriveChatTitle = (text: string) => {
    const normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return 'Sohbet';
    return normalized.slice(0, 120);
  };

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName?.trim()) setUserName(savedName);

    const savedAvatar = localStorage.getItem(storageKey("userAvatar"));
    setUserAvatar(savedAvatar);
  }, [userEmail]);

  // Load message count and premium status from backend
  useEffect(() => {
    const savedCount = localStorage.getItem(storageKey("messageCount"));
    if (savedCount) setMessageCount(parseInt(savedCount, 10));
    
    checkPremiumStatus();
  }, [userEmail]);

  // Function to check premium status
  const checkPremiumStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 401) {
          // Account deleted, logout and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          window.location.href = '/login?deleted=true';
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.user) {
          setIsPremium(data.user.isPremium || false);
          localStorage.setItem(storageKey("isPremium"), String(data.user.isPremium || false));
        }
      })
      .catch(err => console.error('Premium check error:', err));
    }
  };

  // Close mode selector when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showInputModeMenu) {
        setShowInputModeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInputModeMenu]);

  // Close chat menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuChatId) {
        const target = event.target as HTMLElement;
        // Check if click is outside the dropdown menu
        if (!target.closest('.chat-menu-dropdown')) {
          setOpenMenuChatId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuChatId]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Geçersiz dosya',
        description: 'Lütfen bir görsel dosyası seçin.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAttachedImage({ dataUrl, name: file.name, type: file.type });
    };
    reader.onerror = () => {
      toast({
        title: 'Görsel okunamadı',
        description: 'Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // Close user panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserPanel) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-panel-container')) {
          setShowUserPanel(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserPanel]);

  // Auto-focus input so user can type without clicking
  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
    };

    // Focus immediately
    focus();
    
    // Also focus when window regains focus
    const onWindowFocus = () => {
      setTimeout(focus, 100);
    };
    
    // Focus on any keydown
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't focus if user is typing in another input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      inputRef.current?.focus();
    };
    
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('keydown', onKeyDown);
    
    return () => {
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Load chat history and system prompt from localStorage (user-specific)
  useEffect(() => {
    const savedChats = localStorage.getItem(storageKey("chatHistory"));
    if (savedChats) {
      const parsed = JSON.parse(savedChats) as Array<{id: string, title: string, messages: Array<{role: 'user' | 'assistant', content: string}>}>;
      const migrated = parsed.map((chat) => {
        const firstUser = chat.messages?.find((m) => m.role === 'user')?.content || '';
        const hasHardDots = (chat.title || '').trim().endsWith('...');
        if (!hasHardDots) return chat;
        const nextTitle = deriveChatTitle(firstUser);
        return { ...chat, title: nextTitle };
      });
      setChatHistory(migrated);
      if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
        localStorage.setItem(storageKey("chatHistory"), JSON.stringify(migrated));
      }
    }
  }, [userEmail]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const isBackForward = navEntry?.type === 'back_forward';
      if (event.persisted || isBackForward) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow as any);
    return () => {
      window.removeEventListener('pageshow', handlePageShow as any);
    };
  }, []);

  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleEditMessage = (idx: number) => {
    const msg = aiMessages[idx];
    if (!msg || msg.role !== 'user') return;
    setAiInput(msg.content === '📷 Görsel' ? '' : msg.content);
    setAttachedImage(null);
    setEditingMessageIndex(idx);
    setErrorMessage(null);
    setErrorMessageIndex(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSendAIMessage = async () => {
    if (!aiInput.trim() && !attachedImage) return;

    setErrorMessage(null);
    setErrorMessageIndex(null);

    // Check message limit for non-premium users BEFORE adding to UI
    if (!isPremium && messageCount >= MESSAGE_LIMIT) {
      toast({
        title: "Mesaj limiti doldu",
        description: "Daha fazla mesaj göndermek için Premium'a yükseltin.",
        variant: "destructive"
      });
      setShowPricingDialog(true);
      return;
    }
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const currentInput = aiInput;
    const imageDataUrl = attachedImage?.dataUrl;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: aiInput.trim() ? aiInput : (attachedImage ? '📷 Görsel' : aiInput),
      imageDataUrl: imageDataUrl || undefined,
    };

    const baseMessages = editingMessageIndex !== null ? aiMessages.slice(0, editingMessageIndex) : aiMessages;
    const newMessages = [...baseMessages, userMessage];
    setAiMessages(newMessages);
    setAiInput("");
    if (inputRef.current) inputRef.current.style.height = '';
    setAttachedImage(null);
    setEditingMessageIndex(null);
    
    // Increment message count for non-premium users
    if (!isPremium) {
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      localStorage.setItem(storageKey("messageCount"), newCount.toString());
    }
    
    let chatId = currentChatId;
    
    // Create new chat if this is the first message
    if (newMessages.length === 1) {
      chatId = Date.now().toString();
      const chatTitle = deriveChatTitle(currentInput);
      setCurrentChatId(chatId);
      
      const newChat = {
        id: chatId,
        title: chatTitle,
        messages: newMessages
      };
      
      setChatHistory(prevHistory => {
        const updatedHistory = [newChat, ...prevHistory];
        localStorage.setItem(storageKey("chatHistory"), JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    } else if (chatId) {
      // Update existing chat
      setChatHistory(prevHistory => {
        const updatedHistory = prevHistory.map(chat => 
          chat.id === chatId ? { ...chat, messages: newMessages } : chat
        );
        localStorage.setItem(storageKey("chatHistory"), JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
    
    // Call Smart AI API based on selected mode
    setIsLoading(true);
    setIsStreaming(true);
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      let requestBody: any = {
        query: currentInput,
        messages: newMessages,
        imageDataUrl: imageDataUrl || undefined,
      };

      // Modify request based on selected mode
      if (selectedMode === 'thinking') {
        requestBody.enableThinking = true;
      } else if (selectedMode === 'fast') {
        requestBody.fastMode = true;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/groq/smart-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Account deleted, logout and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          window.location.href = '/login?deleted=true';
          return;
        }
        if (response.status === 402) {
          const data = await response.json();
          if (data.isQuotaExceeded) {
            // Restore the message to input since it wasn't processed
            setAiInput(currentInput);
            // Remove the user message from UI since it failed
            setAiMessages(prev => prev.slice(0, -1));
            // Decrement the count since message wasn't actually sent
            if (!isPremium) {
              const newCount = messageCount - 1;
              setMessageCount(newCount);
              localStorage.setItem(storageKey("messageCount"), newCount.toString());
            }
            toast({
              title: "Mesaj limiti doldu",
              description: "Daha fazla mesaj göndermek için Premium'a yükseltin.",
              variant: "destructive"
            });
            setShowPricingDialog(true);
            setIsLoading(false);
            setIsStreaming(false);
            return;
          }
        }
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const fullContent = data.message || '';

      // Typewriter effect - harf harf göster (DAHA HIZLI)
      let currentIndex = 0;
      const typeWriter = () => {
        // Check if aborted
        if (abortController.signal.aborted) {
          setIsStreaming(false);
          setIsLoading(false);
          return;
        }
        
        if (currentIndex <= fullContent.length) {
          const displayedContent = fullContent.slice(0, currentIndex);
          const tempMessage = { role: 'assistant' as const, content: displayedContent };
          const updatedMessages = [...newMessages, tempMessage];
          setAiMessages(updatedMessages);
          currentIndex++;
          
          // ÇOK DAHA HIZLI: Düşünme 3ms, cevap 8ms, fast mode 5ms
          const isInThinking = displayedContent.includes('<thinking>') && !displayedContent.includes('</thinking>');
          const delay = selectedMode === 'fast' ? 3 : (isInThinking ? 3 : 8);
          
          setTimeout(typeWriter, delay);
        } else {
          // Typewriter bitti, loading'i kapat
          setIsStreaming(false);
          setIsLoading(false);
        }
      };
      
      typeWriter();
      
      // Update chat history with final AI response after typing completes
      if (chatId) {
        const finalMessages = [...newMessages, { role: 'assistant' as const, content: fullContent }];
        const delayMultiplier = selectedMode === 'fast' ? 20 : 8;
        setTimeout(() => {
          setChatHistory(prevHistory => {
            const updatedHistory = prevHistory.map(chat => 
              chat.id === chatId ? { ...chat, messages: finalMessages } : chat
            );
            localStorage.setItem(storageKey("chatHistory"), JSON.stringify(updatedHistory));
            return updatedHistory;
          });
        }, fullContent.length * delayMultiplier + 100);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't show error
        console.log('Previous request cancelled');
        return;
      }
      console.error('AI chat error:', error);
      setErrorMessage('Bir hata oluştu. Tekrar deneyin.');
      setErrorMessageIndex(newMessages.length - 1);
      setIsLoading(false);
      setIsStreaming(false);
      // Auto clear error after 5 seconds
      setTimeout(() => {
        setErrorMessage(null);
        setErrorMessageIndex(null);
      }, 5000);
    }
  };

  const handleLoadChat = (chatId: string) => {
    console.log('Loading chat:', chatId);
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      console.log('Found chat, messages count:', chat.messages.length);
      setCurrentChatId(chatId);
      setAiMessages(chat.messages);
    } else {
      console.log('Chat not found:', chatId);
    }
  };

  const handleNewChat = () => {
    // Save current chat before starting new one
    if (currentChatId && aiMessages.length > 0) {
      setChatHistory(prevHistory => {
        const updatedHistory = prevHistory.map(chat => 
          chat.id === currentChatId ? { ...chat, messages: aiMessages } : chat
        );
        localStorage.setItem(storageKey("chatHistory"), JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
    
    setAiMessages([]);
    setCurrentChatId(null);
  };

  const handleDeleteChat = (chatId: string) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);
    localStorage.setItem(storageKey("chatHistory"), JSON.stringify(updatedHistory));
    
    if (currentChatId === chatId) {
      setAiMessages([]);
      setCurrentChatId(null);
    }
    
    setOpenMenuChatId(null);
    toast({ title: "Chat Deleted", description: "Chat has been deleted successfully" });
  };

  return (
    <div className="relative flex h-dvh min-h-screen bg-[#212121] overflow-hidden">
      {/* Left Icon Sidebar - Fixed width, never shrink */}
      <div className="w-16 flex-shrink-0 bg-[#171717] flex flex-col items-center py-4 gap-1">
        {/* Toggle Sidebar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        {/* New Chat */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChat}
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>

        {/* Help */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHelpDialog(true)}
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>

        <div className="flex-1" />

        {!isPremium && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPricingDialog(true)}
            className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
            aria-label="Planı yükselt"
          >
            <Crown className="w-5 h-5" />
          </Button>
        )}

        {/* User */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowUserPanel(!showUserPanel)}
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
        >
          <User className="w-5 h-5" />
        </Button>

        {/* User Panel */}
        {showUserPanel && (
          <div className="user-panel-container absolute left-16 bottom-4 w-56 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl shadow-2xl z-50 p-4">
            <div className="flex items-center gap-3 mb-3">
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                  {(userName?.trim()?.[0] || "U").toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-medium text-sm">{userName}</p>
                <p className="text-gray-400 text-xs">{userEmail}</p>
              </div>
            </div>
            <div className="border-t border-[#3a3a3a] pt-3 space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-gray-400">Durum:</span>
                <span className={`text-xs font-medium ${isPremium ? 'text-green-400' : 'text-orange-400'}`}>
                  {isPremium ? 'Premium' : 'Ücretsiz'}
                </span>
              </div>
              <button 
                onClick={() => {
                  checkPremiumStatus();
                  toast({ title: "Durum güncellendi", description: "Premium durumunuz kontrol edildi." });
                }}
                className="w-full text-left text-sm text-gray-300 hover:text-white hover:bg-[#3a3a3a] rounded px-2 py-1.5"
              >
                Durumu Yenile
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full text-left text-sm text-gray-300 hover:text-white hover:bg-[#3a3a3a] rounded px-2 py-1.5"
              >
                Profil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay - only when sidebar open on mobile */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/10 sm:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
          aria-label="Kenar çubuğunu kapat"
        />
      )}
      <div
        className={`bg-[#171717] border-r border-[#2a2a2a] flex flex-col overflow-hidden flex-shrink-0 transition-all duration-200 ease-out ${
          isSidebarCollapsed
            ? 'w-0 border-r-0 overflow-hidden'
            : 'w-64 translate-x-0'
        }`}
      >
        <div className="w-64 flex flex-col h-full flex-shrink-0">
          {/* Sidebar Header with Close Button */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-[#2a2a2a]">
            <h3 className="text-sm font-semibold text-white">Sohbet Geçmişi</h3>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2 pt-3">
            {chatHistory.length > 0 ? (
              <>
                <div className="text-xs text-gray-500 px-3 py-2 font-semibold">Son</div>
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <div 
                      key={chat.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Chat item clicked:', chat.id);
                        handleLoadChat(chat.id);
                      }}
                      className={`group relative flex items-center px-3 py-2 rounded-lg cursor-pointer min-w-0 ${
                        currentChatId === chat.id 
                          ? 'bg-[#2a2a2a] text-white' 
                          : 'text-gray-400 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex-1 min-w-0 text-sm truncate">
                        {chat.title}
                      </div>
                      <button
                        className="ml-2 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded hover:bg-[#3a3a3a] text-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                          <circle cx="2" cy="8" r="1.4"/>
                          <circle cx="8" cy="8" r="1.4"/>
                          <circle cx="14" cy="8" r="1.4"/>
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuChatId === chat.id && (
                        <div 
                          className="chat-menu-dropdown absolute right-0 top-full mt-1 w-40 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-lg z-50 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDeleteChat(chat.id)}
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-[#3a3a3a] hover:text-white flex items-center gap-2 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Sil
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                Henüz sohbet geçmişi yok
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area - Takes remaining space */}
      <div className="flex-1 flex flex-col bg-[#212121] min-w-0 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-32 min-h-0">
          {aiMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-8">Ne üzerinde çalışıyorsun?</h1>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 w-full">
              {aiMessages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                >
                  <div className={message.role === 'user' ? 'group relative max-w-[75%] pb-10' : 'max-w-[75%]'}>
                    <div
                      className={
                        message.role === 'user'
                          ? 'rounded-2xl px-4 py-2 text-white bg-[#555555]'
                          : 'text-white'
                      }
                    >
                    {message.role === 'user' ? (
                      <div className="space-y-2">
                        {message.imageDataUrl && (
                          <img
                            src={message.imageDataUrl}
                            alt="Görsel"
                            className="max-w-full max-h-48 rounded-lg object-contain"
                          />
                        )}
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        {errorMessage && errorMessageIndex === idx && (
                          <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs sm:text-sm">
                            {errorMessage}
                          </div>
                        )}
                      </div>
                    ) : (
                      <AIResponse content={message.content} />
                    )}
                    </div>

                    {message.role === 'user' && (
                      <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                        <button
                          type="button"
                          onClick={async () => {
                            await copyText(message.content);
                            setCopiedUserMessageIndex(idx);
                            setTimeout(() => {
                              setCopiedUserMessageIndex((prev) => (prev === idx ? null : prev));
                            }, 1200);
                          }}
                          className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a] flex items-center justify-center"
                          aria-label="Mesajı kopyala"
                          title="Kopyala"
                        >
                          {copiedUserMessageIndex === idx ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditMessage(idx)}
                          className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a] flex items-center justify-center"
                          aria-label="Mesajı düzenle"
                          title="Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#212121]">
          <div className="w-full max-w-2xl mx-auto">
            {attachedImage && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#2a2a2a] bg-[#171717] px-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={attachedImage.dataUrl}
                    alt={attachedImage.name}
                    className="h-10 w-10 rounded-lg object-cover border border-[#2a2a2a]"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">{attachedImage.name}</div>
                    <div className="text-xs text-gray-500 truncate">Görsel eklendi</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setAttachedImage(null)}
                  className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  aria-label="Görseli kaldır"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            )}
            <div className="relative flex flex-col bg-[#2a2a2a] border border-[#3a3a3a] rounded-3xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={aiInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setAiInput(val);
                  setShouldLiftInput(val.length >= 64);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isStreaming) {
                      handleSendAIMessage();
                    }
                  }
                }}
                placeholder="Mesaj yaz..."
                rows={1}
                className={`chat-input-textarea w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none resize-none min-h-[44px] leading-relaxed pt-2 transition-[padding] duration-300 ease-in-out ${shouldLiftInput ? 'pb-14 pr-3' : 'pb-2 pr-32 sm:pr-44'}`}
              />
              <div className="absolute bottom-2 right-3 flex items-center gap-1 sm:gap-1.5 z-10 bg-[#2a2a2a]">
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-[#3a3a3a]"
                    onClick={handlePickImage}
                    type="button"
                  >
                    <Upload className="w-5 h-5" />
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                  />
                  
                  <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      onClick={() => setShowInputModeMenu((v) => !v)}
                      className="hidden sm:flex h-9 rounded-full px-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#3a3a3a] items-center gap-1.5"
                    >
                      {selectedMode === 'fast' ? 'Hızlı' : selectedMode === 'thinking' ? 'Düşünme' : 'Normal'}
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>

                    {showInputModeMenu && (
                      <div
                        className="absolute right-0 bottom-11 w-40 bg-[#232323] border border-[#333] rounded-lg shadow-lg z-50 py-1"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { setSelectedMode('fast'); setShowInputModeMenu(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3a3a3a] ${selectedMode === 'fast' ? 'text-white' : 'text-gray-300'}`}
                        >
                          Hızlı
                        </button>
                        <button
                          onClick={() => { setSelectedMode('thinking'); setShowInputModeMenu(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3a3a3a] ${selectedMode === 'thinking' ? 'text-white' : 'text-gray-300'}`}
                        >
                          Düşünme
                        </button>
                        <button
                          onClick={() => { setSelectedMode('normal'); setShowInputModeMenu(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3a3a3a] ${selectedMode === 'normal' ? 'text-white' : 'text-gray-300'}`}
                        >
                          Normal
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={isStreaming ? handleStopResponse : handleSendAIMessage} 
                    disabled={!aiInput.trim() && !attachedImage}
                    className="w-9 h-9 aspect-square !rounded-full bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:opacity-50 p-0"
                    size="icon"
                  >
                    {isStreaming ? (
                      <Square className="w-4 h-4 text-black" />
                    ) : (
                      <Send className="w-4 h-4 text-black" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="bg-[#2a2a2a]/95 backdrop-blur-xl border-[#3a3a3a] text-white shadow-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-400" /> Yardım ve Destek
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              SyntGPT kullanımı hakkında bilgiler
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Quick Start */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" /> Hızlı Başlangıç
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">1.</span>
                  <span>Sohbet başlatmak için alttaki mesaj kutusuna yazın ve Enter'a basın</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">2.</span>
                  <span>Yeni sohbet için sol üstteki + butonuna tıklayın</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">3.</span>
                  <span>Sohbet geçmişini görmek için sol menüyü kullanın</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">4.</span>
                  <span>Ayarlar butonundan AI'nın davranışını özelleştirin</span>
                </li>
              </ul>
            </div>

            <Separator className="bg-[#3a3a3a]" />

            {/* FAQ */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-400" /> Sıkça Sorulan Sorular
              </h3>
              <div className="space-y-3">
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <p className="font-medium text-white text-sm mb-1">Ücretsiz hesapla kaç mesaj gönderebilirim?</p>
                  <p className="text-xs text-gray-400">Ücretsiz hesaplar günde 5 mesaj gönderebilir. Premium'a yükselterek sınırsız mesaj gönderebilirsiniz.</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <p className="font-medium text-white text-sm mb-1">Sohbet geçmişim kaybolur mu?</p>
                  <p className="text-xs text-gray-400">Hayır, tüm sohbetleriniz tarayıcınızda güvenle saklanır. Sadece siz silerseniz silinir.</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <p className="font-medium text-white text-sm mb-1">AI hangi konularda yardımcı olabilir?</p>
                  <p className="text-xs text-gray-400">Yazı yazma, kodlama, araştırma, çeviri, özetleme, beyin fırtınası ve çok daha fazlası!</p>
                </div>
              </div>
            </div>

            <Separator className="bg-[#3a3a3a]" />

            {/* Contact */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" /> İletişim
              </h3>
              <p className="text-sm text-gray-400 mb-2">Sorularınız veya önerileriniz için bize ulaşın:</p>
              <a 
                href="mailto:syntgpt2121@gmail.com" 
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
              >
                <Mail className="w-4 h-4" /> syntgpt2121@gmail.com
              </a>
            </div>

            <Separator className="bg-[#3a3a3a]" />

            {/* Premium CTA */}
            {!isPremium && (
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-cyan-400" /> Premium'a Yükselt
                </h3>
                <p className="text-sm text-gray-300 mb-3">Sınırsız mesaj, öncelikli destek ve daha fazla özellik!</p>
                <Button 
                  onClick={() => {
                    setShowHelpDialog(false);
                    setShowPricingDialog(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Planları Gör
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog - REAL SYSTEM */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white shadow-2xl max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-cyan-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Mesaj Limitine Ulaştınız
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Ücretsiz planda günlük {MESSAGE_LIMIT} mesaj hakkınız bulunmaktadır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Usage Bar */}
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Kullanım</span>
                <span className="text-white">{messageCount} / {MESSAGE_LIMIT} mesaj</span>
              </div>
              <div className="w-full bg-[#3a3a3a] rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(messageCount / MESSAGE_LIMIT) * 100}%` }}
                />
              </div>
            </div>

            {/* Premium Offer */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-cyan-400" /> Premium
              </h3>
              <p className="text-2xl font-bold text-white mb-1">99₺<span className="text-sm text-gray-400">/ay</span></p>
              <ul className="text-sm text-gray-300 space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Sınırsız mesaj
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Öncelikli destek
                </li>
              </ul>
              <Button 
                onClick={() => {
                  setShowPricingDialog(false);
                  navigate('/premium');
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
              >
                <CreditCard className="w-4 h-4 mr-2" /> 
                Premium'a Yükselt
              </Button>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setShowPricingDialog(false)}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              Kapat
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
