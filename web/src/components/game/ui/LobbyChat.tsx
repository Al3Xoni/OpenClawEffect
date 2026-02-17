"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useWallet } from '@solana/wallet-adapter-react';

// Initialize Supabase (Using env variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export const LobbyChat: React.FC = () => {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load and Subscribe to Real-time messages
  useEffect(() => {
    if (!supabaseUrl) return;

    // 1. Fetch existing messages (Initial Load)
    const fetchInitial = async () => {
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .order('timestamp', { ascending: true })
            .limit(50);
        
        if (data) setMessages(data);
    };
    fetchInitial();

    // 2. Subscribe to new messages
    const channel = supabase
        .channel('lobby-chat')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages' 
        }, (payload) => {
            setMessages(prev => [...prev, payload.new as ChatMessage].slice(-50));
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !supabaseUrl) return;

    const senderName = publicKey 
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : `Anon_${Math.floor(Math.random() * 1000)}`;

    const messageData = {
        sender: senderName,
        text: inputText.trim(),
        timestamp: Date.now()
    };

    const textToSubmit = inputText.trim();
    setInputText(''); // Optimistic UI clear

    // Insert into Supabase
    const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

    if (error) console.error("Chat error:", error);
  };

  return (
    <div className="absolute bottom-6 left-6 z-40 w-80">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-64">
            
            {/* Header */}
            <div className="bg-white/5 p-2 border-b border-white/10 flex justify-between items-center text-[10px] font-bold">
                <span className="text-cyan-400 ml-2">LOBBY CHAT (SOLANA)</span>
                {!supabaseUrl && <span className="text-red-500">OFFLINE</span>}
            </div>

            {/* Messages Area */}
            <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-[10px] mt-10 italic">
                        {!supabaseUrl ? "Wait, Chat not configured..." : "No messages yet."}
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className="text-xs">
                        <span className="font-bold text-cyan-200 opacity-75 mr-2">{msg.sender}:</span>
                        <span className="text-gray-300 break-words">{msg.text}</span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-2 border-t border-white/10 bg-black/40">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={supabaseUrl ? "Type message..." : "Chat disabled"}
                    disabled={!supabaseUrl}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
            </form>
        </div>
    </div>
  );
};