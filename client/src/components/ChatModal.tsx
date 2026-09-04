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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(24, 32, 24, 0.45)', backdropFilter: 'blur(4px)',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
        borderRadius: 8, width: '100%', maxWidth: 520, height: 560,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--sb-border, #D8E0D5)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--sb-surface, #FFFFFF)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 4,
              background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sb-primary, #6F8F69)',
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                {title}
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', margin: '2px 0 0' }}>
                Chatting with <span style={{ color: 'var(--sb-text-primary, #182018)', fontWeight: 500 }}>{counterpartyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--sb-text-muted, #7A847A)',
              cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sb-text-primary, #182018)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sb-text-muted, #7A847A)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Body */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12,
          background: 'var(--sb-background, #F7F7F2)',
        }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--sb-border, #D8E0D5)', borderTopColor: 'var(--sb-primary, #6F8F69)', borderRadius: '50%' }} className="animate-stitch-spin" />
            </div>
          ) : error ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 12,
              fontFamily: 'Work Sans, sans-serif', fontSize: 13,
              color: 'var(--sb-danger, #A65C55)', background: 'rgba(166,92,85,0.08)',
              border: '1px solid rgba(166,92,85,0.2)', borderRadius: 4,
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
              <Bot size={36} color="var(--sb-border-strong, #BEC9BA)" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', marginBottom: 4 }}>
                No messages yet
              </p>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', maxWidth: 280 }}>
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
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span style={{
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11,
                    color: 'var(--sb-text-muted, #7A847A)', marginBottom: 4, padding: '0 4px',
                  }}>
                    {isMine ? 'You' : msg.sender?.name || 'Counterparty'} • {formattedTime}
                  </span>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 6,
                    fontFamily: 'Work Sans, sans-serif', fontSize: 13, lineHeight: 1.5,
                    wordBreak: 'break-word',
                    ...(isMine
                      ? {
                          background: 'var(--sb-primary, #6F8F69)',
                          color: '#FFFFFF',
                          border: '1px solid var(--sb-primary, #6F8F69)',
                        }
                      : {
                          background: 'var(--sb-surface, #FFFFFF)',
                          color: 'var(--sb-text-primary, #182018)',
                          border: '1px solid var(--sb-border, #D8E0D5)',
                        }),
                  }}>
                    {msg.text}
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
          style={{
            padding: '12px 16px', borderTop: '1px solid var(--sb-border, #D8E0D5)',
            background: 'var(--sb-surface, #FFFFFF)', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message (negotiate pickup, details)..."
            style={{
              flex: 1, background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 4, padding: '10px 14px',
              fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-primary, #182018)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="stitch-btn-primary"
            style={{
              padding: '10px 16px', borderRadius: 4,
              opacity: !inputText.trim() ? 0.4 : 1,
              cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
