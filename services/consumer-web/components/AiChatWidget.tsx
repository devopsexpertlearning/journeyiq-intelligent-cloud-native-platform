'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

const SUGGESTED_MESSAGES = [
    { icon: '✈️', text: 'Find flights to Paris' },
    { icon: '🏨', text: 'Hotels in New York' },
    { icon: '📅', text: 'Best time to travel' },
    { icon: '💼', text: 'Travel requirements' },
];

export function AiChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hi there! I\'m your JourneyIQ AI assistant. How can I help you plan your trip today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string>('anonymous');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, scrollToBottom]);

    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await api.post<{ response: string; user_id: string }>('/ai/chat', {
                message: userMsg,
                user_id: userId
            });

            setMessages(prev => [...prev, { role: 'ai', content: response.response }]);
        } catch (error) {
            console.error('AI Chat error:', error);
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again later. You can also ask me about flights, hotels, or travel recommendations!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestedMessage = (message: string) => {
        setInput(message);
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSend(fakeEvent);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSend(fakeEvent);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ease-out animate-in slide-in-from-bottom-10 fade-in">
                    {/* Header */}
                    <div className="p-4 bg-gray-800 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>
                            </div>
                            <div>
                                <span className="font-semibold text-white">JourneyIQ Agent</span>
                                <div className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Online
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-900/95 backdrop-blur-sm">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg shadow-blue-500/20'
                                        : 'bg-gray-800 text-gray-100 rounded-bl-none border border-white/5 shadow-lg'
                                    }`}>
                                    {msg.role === 'ai' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                            </div>
                                            <span className="text-xs font-medium text-blue-400">AI Assistant</span>
                                        </div>
                                    )}
                                    <div className="leading-relaxed">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 border border-white/5">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Messages */}
                    {messages.length <= 2 && (
                        <div className="px-4 py-3 bg-gray-800/50 border-t border-white/5">
                            <div className="text-xs text-gray-500 mb-2">Quick suggestions:</div>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_MESSAGES.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestedMessage(suggestion.text)}
                                        className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 hover:shadow-lg"
                                    >
                                        <span>{suggestion.icon}</span>
                                        <span>{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-gray-800 border-t border-white/10">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything about your trip..."
                                rows={1}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-4 pr-20 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none min-h-[44px] max-h-32 placeholder:text-gray-500"
                                style={{ height: 'auto' }}
                            />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                    title="Send message"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 text-center">
                            Powered by JourneyIQ AI
                        </div>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="ai-chat-trigger group flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:scale-110 transition-all duration-200 focus:outline-none ring-2 ring-white/20 hover:ring-purple-400/50"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white transform group-hover:rotate-12 transition-transform">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                    </div>
                )}
            </button>
        </div>
    );
}
