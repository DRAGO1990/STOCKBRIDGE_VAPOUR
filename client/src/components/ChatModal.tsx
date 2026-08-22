import React, { useEffect, useState, useRef } from 'react';
import { Send, X, MessageSquare, Bot, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { getSocket, connectSocket } from '../lib/socket';
import { useAuthStore } from '../stores/authStore';
import type { Message } from '../types';

interface ChatModalProps {
  reservationId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  counterpartyName?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  reservationId,
  isOpen,
  onClose,
  title = 'Direct Negotiation Chat',
  counterpartyName = 'Trader',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isOpen || !reservationId) return;

    setLoading(true);
    setError('');

    // Fetch initial chat history
    api
      .get(`/messages/reservation/${reservationId}`)
      .then((res) => {
        setMessages(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load messages', err);
        setError('Failed to load message history.');
        setLoading(false);
      });

    // Connect socket and join room
    const socket = connectSocket();
    socket.emit('join-reservation', reservationId);

    const handleNewMessage = (msg: Message) => {
      if (msg.reservationId === reservationId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.emit('leave-reservation', reservationId);
      socket.off('new-message', handleNewMessage);
    };
  }, [isOpen, reservationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const socket = getSocket() || connectSocket();
    socket.emit('send-message', {
      reservationId,
      text: inputText.trim(),
    });

    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1b2151] border border-[#3f4b81] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col h-[550px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#3f4b81] flex items-center justify-between bg-[#151a41]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <p className="text-xs text-slate-400">Chatting with {counterpartyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f1329]/50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800 rounded-lg">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bot size={36} className="text-teal-400/60 mb-2" />
              <p className="text-sm font-medium text-slate-300">No messages yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Coordinate pickup time, logistics, payment terms, or final verification here in real-time.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-1 px-1">
                    {isMine ? 'You' : msg.sender?.name || 'Counterparty'} • {formattedTime}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-br-none'
                        : 'bg-[#293264] text-slate-100 rounded-bl-none border border-[#3f4b81]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-[#3f4b81] bg-[#151a41] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message (negotiate pickup, details)..."
            className="flex-1 bg-[#0f1329] border border-[#3f4b81] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-navy-950 font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
