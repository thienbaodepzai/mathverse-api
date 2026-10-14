import React, { useState, useRef, useEffect } from 'react';
import { useMathVerse } from '../context/MathVerseContext';
import { Bot, Send, Sparkles, User, Lightbulb, Trash2, ArrowUpRight } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';
import { formatMathNotation } from '../utils/formatMath';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const PRESET_QUESTIONS = [
  'Giải phương trình này giúp em: 2x + 5 = 15',
  'Vì sao hai số âm nhân với nhau lại ra số dương? [(-3) . (-4) = 12]',
  'Cách tính diện tích hình thang và mẹo ghi nhớ bằng thơ?',
  'Định lý Pythagore là gì và áp dụng trong tam giác vuông thế nào?',
  'Quy tắc quy đồng mẫu số nhiều phân số gồm những bước nào?',
  'Hệ thức Vi-ét dùng để làm gì trong phương trình bậc hai?',
];

export const MathBotChat: React.FC = () => {
  const { user } = useMathVerse();
  const currentGrade = user?.grade || 6;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Chào ${user?.name || 'em'}! 🚀 Thầy là **MathBot** – Gia sư Trợ lý AI Toán học đồng hành cùng em trong chương trình Toán THCS (Lớp ${currentGrade}).\n\nEm đang gặp khó khăn ở bài toán hay công thức nào? Hãy gửi đề bài hoặc nhấn vào các gợi ý bên dưới để chúng mình cùng khám phá từng bước nhé!`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    soundManager.playClickSound();
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/mathbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          grade: currentGrade,
          topic: 'Toán THCS',
          history: messages.slice(-5).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi phản hồi từ máy chủ');
      }

      const data = await response.json();
      const botReply = data.reply || 'MathBot đã nhận được câu hỏi nhưng chưa có phản hồi. Em thử lại nhé!';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: formatMathNotation(botReply),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
      soundManager.playCorrectSound();
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `✨ **MathBot sẵn sàng hỗ trợ em!**\n\nĐối với câu hỏi "${textToSend}":\nEm hãy ghi rõ số liệu hoặc từng bước em đã giải được để thầy hướng dẫn chỉ ra chỗ cần khắc phục nhé!`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `w-${Date.now()}`,
        role: 'assistant',
        content: `Cuộc trò chuyện đã được làm mới. Em có câu hỏi Toán nào muốn hỏi MathBot không?`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md shadow-indigo-600/20">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                MathBot AI
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gia sư giải thích từng bước • Phù hợp Toán Lớp {currentGrade}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Xóa lịch sử trò chuyện"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Pills */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Câu hỏi nhanh:
        </span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400 hover:bg-indigo-950/40 text-slate-300 hover:text-cyan-300 text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1"
          >
            <span>{q.length > 32 ? q.slice(0, 32) + '...' : q}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500" />
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                  isUser
                    ? 'bg-cyan-600/30 border-cyan-400/40 text-cyan-200'
                    : 'bg-indigo-600/30 border-indigo-400/40 text-indigo-200'
                }`}
              >
                {isUser ? user?.avatar || '👤' : '🤖'}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-sm shrink-0">
              🤖
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>MathBot đang suy nghĩ và chuẩn bị từng bước giải...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi bài tập, công thức hoặc cách giải bài toán..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
