import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Zap, Palette, Smartphone } from 'lucide-react';
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  reasoning?: string; // For AI reasoning
}
interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  lastReasoning?: string; // To show AI reasoning
  currentReasoning?: string; // For real-time reasoning display
  isShowingReasoning?: boolean; // Whether reasoning is currently being typed
}
const ChatPanel = ({
  onSendMessage,
  isGenerating,
  lastReasoning,
  currentReasoning,
  isShowingReasoning
}: ChatPanelProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: 'Hello! I\'m your AI assistant. I can create new landing pages or make targeted edits to existing ones. Just describe what you want!',
    sender: 'ai',
    timestamp: new Date()
  }]);
  const quickSuggestions = [{
    icon: Zap,
    text: 'Dark SaaS landing',
    prompt: 'Create a dark SaaS landing page for an AI writing tool'
  }, {
    icon: Palette,
    text: 'Creative agency',
    prompt: 'Build a creative agency portfolio page with bold colors'
  }, {
    icon: Smartphone,
    text: 'Mobile app landing',
    prompt: 'Design a modern mobile app landing page'
  }];

  // Add AI reasoning as a message when it becomes available
  useEffect(() => {
    if (lastReasoning && lastReasoning.trim()) {
      const reasoningMessage: Message = {
        id: `reasoning-${Date.now()}`,
        content: lastReasoning,
        sender: 'ai',
        timestamp: new Date(),
        reasoning: lastReasoning
      };
      setMessages(prev => [...prev, reasoningMessage]);
    }
  }, [lastReasoning]);
  const handleSend = () => {
    if (!message.trim() || isGenerating) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    onSendMessage(message);
    setMessage('');
  };
  const handleQuickSuggestion = (prompt: string) => {
    if (isGenerating) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: prompt,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    onSendMessage(prompt);
  };
  return <div className="flex flex-col h-full bg-chat-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          
          <div>
            
            <p className="text-xs text-muted-foreground">Describe your vision</p>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="space-y-2">
          {quickSuggestions.map((suggestion, index) => <Button key={index} variant="outline" size="sm" className="w-full justify-start text-xs h-8 transition-smooth hover:bg-primary/10 hover:border-primary/30" onClick={() => handleQuickSuggestion(suggestion.prompt)} disabled={isGenerating}>
              <suggestion.icon className="w-3 h-3 mr-2" />
              {suggestion.text}
            </Button>)}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
          {messages.map(msg => <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm transition-smooth ${msg.sender === 'user' ? 'bg-chat-user text-white' : msg.reasoning ? 'bg-chat-ai text-white' : 'bg-chat-ai text-white'}`}>
                {msg.reasoning && <div className="text-xs font-medium text-white mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Reasoning:
                  </div>}
                <p className="text-white">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                </span>
              </div>
            </div>)}
          
          {/* Current reasoning being typed */}
          {isShowingReasoning && currentReasoning && (
            <div className="flex justify-start">
              <div className="bg-chat-ai rounded-lg p-3 text-sm max-w-[85%]">
                <div className="text-xs font-medium text-white mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Reasoning:
                </div>
                <p className="text-white whitespace-pre-wrap">
                  {currentReasoning}
                  <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse" />
                </p>
              </div>
            </div>
          )}
          
          {isGenerating && !isShowingReasoning && <div className="flex justify-start">
              <div className="bg-chat-ai border border-border rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="typing-indicator">●</div>
                  <div className="typing-indicator" style={{
                  animationDelay: '0.2s'
                }}>●</div>
                  <div className="typing-indicator" style={{
                  animationDelay: '0.4s'
                }}>●</div>
                  <span className="ml-2 text-muted-foreground">Generating your page...</span>
                </div>
              </div>
            </div>}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex gap-2">
          <Input placeholder="Describe your landing page..." value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={isGenerating} className="flex-1 bg-input border-border focus:border-primary/50 focus:ring-primary/20 transition-smooth" />
          <Button onClick={handleSend} disabled={!message.trim() || isGenerating} size="icon" className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>;
};
export default ChatPanel;