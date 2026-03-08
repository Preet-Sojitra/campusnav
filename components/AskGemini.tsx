"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Paperclip, Volume2, VolumeX } from "lucide-react";
import { useSchedule } from "@/app/context/ScheduleContext";
import { useVirtualClock } from "@/lib/virtual-clock";

import ReactMarkdown from 'react-markdown';

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
    isError?: boolean;
};

const SUGGESTIONS = [
    "What should I do during my 2pm gap?",
    "Summarize CS 3345 for quick review",
];

export default function AskGemini() {
    const { classes, gaps, selectedDay, hasRealData } = useSchedule();
    const { now } = useVirtualClock();

    const [isOpen, setIsOpen] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi there! I'm Gemini. How can I help you organize your schedule or review your materials today?",
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    // --- TTS Logic --- 
    const playTTS = async (text: string, type: "schedule" | "navigation" | "recommendation" = "recommendation") => {
        if (!voiceEnabled || isPlayingAudio) return;

        try {
            setIsPlayingAudio(true);
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type })
            });

            if (!res.ok) throw new Error("TTS failed");

            // Web Audio API to play the stream chunks or just simple Audio
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onended = () => {
                setIsPlayingAudio(false);
                URL.revokeObjectURL(url);
            };

            await audio.play();
        } catch (err) {
            console.error("TTS Error:", err);
            setIsPlayingAudio(false);
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "", isStreaming: true }]);

        let currentText = "";

        try {
            // Build real-time context to send to the AI
            let contextStr = `Current Virtual Time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\nSelected Day: ${selectedDay}\n`;
            if (hasRealData) {
                contextStr += `Today's Classes:\n${JSON.stringify(classes, null, 2)}\n`;
                contextStr += `Today's Schedule Gaps / Free Time:\n${JSON.stringify(gaps, null, 2)}\n`;
            } else {
                contextStr += `(No schedule data uploaded yet by the user. Let them know they should upload their schedule.)\n`;
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text, context: contextStr }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (!response.body) {
                throw new Error('No readable stream returned');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                currentText += decoder.decode(value, { stream: true });
                setMessages((prev) =>
                    prev.map(msg =>
                        msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
                    )
                );
            }
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = "Sorry, I had trouble reaching the server. Please make sure the GEMINI_API_KEY is set in your `.env.local`.";
            setMessages((prev) =>
                prev.map(msg =>
                    msg.id === assistantMsgId ? {
                        ...msg,
                        content: errorMsg,
                        isError: true
                    } : msg
                )
            );
            playTTS(errorMsg, "recommendation");
        } finally {
            setMessages((prev) =>
                prev.map(msg =>
                    msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
                )
            );

            // Play TTS with the fully accumulated message text outside of React state setter
            if (currentText) {
                const content = currentText.toLowerCase();
                let ttsType: "schedule" | "navigation" | "recommendation" = "recommendation";

                if (content.includes("walk") || content.includes("turn") || content.includes("directions") || content.includes("route") || content.includes("minutes to")) {
                    ttsType = "navigation"; // Adam
                } else if (content.includes("schedule") || content.includes("class") || content.includes("today")) {
                    ttsType = "schedule"; // Rachel
                }

                // remove markdown symbols for TTS
                const cleanText = currentText.replace(/[*_#`]/g, '');
                playTTS(cleanText, ttsType);
            }

            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">
            {/* Floating Buton */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <Sparkles size={20} className="fill-current animate-pulse" />
                    <span className="font-semibold tracking-wide">Ask Gemini</span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="w-[380px] h-[580px] sm:h-[650px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 fade-in-0 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 text-[15px]">Ask Gemini</h3>
                                <p className="text-xs text-slate-500 font-medium">✨ Powered by AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${voiceEnabled ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-white"}`}
                                title={voiceEnabled ? "Disable Voice Assistant" : "Enable Voice Assistant"}
                            >
                                {voiceEnabled ? <Volume2 size={16} className={isPlayingAudio ? "animate-pulse" : ""} /> : <VolumeX size={16} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 pb-2 flex flex-col gap-4 bg-slate-50/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"
                                    }`}
                            >
                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "bg-slate-900 text-white rounded-br-sm"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                                        } ${(msg as any).isError ? "border-red-300 bg-red-50 text-red-800" : ""}`}
                                >
                                    <div className="prose prose-sm prose-p:leading-snug prose-ul:my-1 prose-li:my-0.5 max-w-none break-words">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                    {msg.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500 animate-pulse rounded-sm mt-1" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions (only show if few messages to save space) */}
                    {messages.length < 3 && !isTyping && (
                        <div className="px-5 py-3 flex flex-col gap-2">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Suggested for you</p>
                            {SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSend(suggestion)}
                                    className="text-left px-3 py-2 text-[13px] text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex items-end gap-2 p-1.5 bg-slate-100 hover:bg-slate-200/60 transition-colors rounded-2xl border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm">
                            <button
                                type="button"
                                className="p-2.5 text-slate-400 hover:text-blue-500 transition-colors shrink-0 tooltip-trigger"
                                title="Upload Syllabus (Coming Soon)"
                            >
                                <Paperclip size={18} />
                            </button>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(input);
                                    }
                                }}
                                placeholder="Ask Gemini..."
                                className="w-full bg-transparent border-none focus:outline-none resize-none text-[14px] text-slate-700 placeholder-slate-400 max-h-[120px] py-2.5 min-h-[44px]"
                                rows={1}
                            />
                            <button
                                onClick={() => handleSend(input)}
                                disabled={!input.trim() || isTyping}
                                className={`p-2.5 rounded-xl shrink-0 transition-colors ${input.trim() && !isTyping
                                    ? "text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                                    : "text-slate-400 bg-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                <Send size={16} className={input.trim() && !isTyping ? "translate-x-0.5 -translate-y-0.5" : ""} />
                            </button>
                        </div>
                        <div className="mt-3 text-center">
                            <p className="text-[10px] text-slate-400">Gemini can make mistakes. Check important info.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
