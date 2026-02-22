import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleGenAI } from "@google/genai";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
}

const SUGGESTIONS = [
    "How do I register a startup?",
    "Explain funding stages",
    "What are government schemes for MSMEs?",
    "How to build a pitch deck?"
];

export function AiChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Welcome to SAVISHKAR Intelligence. I am your specialized Business & Innovation Consultant. How can I assist your entrepreneurial journey today?",
            createdAt: Date.now()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user, profile } = useAuth();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;

        const userMessage = text.trim();
        setInput("");

        const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userMessage,
            createdAt: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
        setLoading(true);

        try {
            // Check for API key in environment
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            let aiResponse = "";

            if (geminiApiKey) {
                try {
                    // Initialize the real Gemini AI model
                    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

                    const systemPrompt = `You are an elite Business Innovation Consultant for SAVISHKAR India. 
                    Your expertise includes: Startups, Entrepreneurship, Government Schemes (Startup India), Funding, Scaling, and Business Strategy.
                    Answer with professional, high-value insights. Use bullet points for clarity. Be encouraging and helpful.
                    Always respond primarily in the language the user asked the question in (e.g. Hindi, English).
                    If a question is completely unrelated to business/innovation, politely refocus the user to SAVISHKAR's mission.`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [
                            { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + userMessage }] }
                        ],
                    });

                    aiResponse = response.text || "I apologize, but I couldn't formulate a response.";

                } catch (apiError) {
                    console.error("Gemini API Error:", apiError);
                    aiResponse = "I'm currently experiencing high network traffic. Please try again later.";
                }
            } else {
                // Fallback: "Simulated LLM" Mode (If no API Key provided by Admin yet)
                console.log("No VITE_GEMINI_API_KEY found. Falling back to Simulated LLM.");
                await new Promise(resolve => setTimeout(resolve, 1000)); // Thinking time

                const text = userMessage.toLowerCase();

                if (text.match(/\b(hi|hello|hey|greetings|namaste)\b/)) {
                    aiResponse = "Hello there! It's great to connect. I'm here to help you navigate your startup journey. What's on your mind today? We can discuss ideas, funding, or even just how to get started.";
                }
                else if (text.match(/\b(how are you|who are you|what are you)\b/)) {
                    aiResponse = "I'm doing great, fully operational and ready to assist! I am an advanced AI advisor designed specialized for the SAVISHKAR ecosystem. My goal is to help innovators like you succeed.";
                }
                else if (text.match(/\b(fund|money|invest|capital|grant|finance)\b/)) {
                    aiResponse = "Funding is often the fuel for any great venture. Generally, you have a few options: bootstrapping, seeking angel investors, or applying for government grants. SAVISHKAR specifically offers Seed Grants for early-stage prototypes. Have you validated your product yet? That usually helps in securing funds.";
                }
                else if (text.match(/\b(idea|thinking|plan|startup|business)\b/)) {
                    aiResponse = "That sounds promising. Every great startup begins with a simple idea. The key is execution and validation. I'd suggest documenting your core concept and maybe running it by a few potential users. We actually have a 'Pitch Deck' template in the Resources section that could help you structure your thoughts effectively.";
                }
                else if (text.match(/\b(join|register|signup|account|login)\b/)) {
                    aiResponse = "I'd love for you to join our community. It's a straightforward process—just click the 'Join Us' button at the top right of the page. You'll need to create a profile, and you'll receive a digital ID card that gives you access to all our mentorship and funding programs.";
                }
                else if (text.match(/\b(thank|thanks|good|great|awesome)\b/)) {
                    aiResponse = "You're very welcome! I'm glad I could help. If any other questions pop up as you continue working, feel free to ask. I'm always here.";
                }
                else if (text.match(/\b(mentor|guide|advice|help)\b/)) {
                    aiResponse = "Having a mentor can drastically reduce your learning curve. We have a network of industry veterans from organizations like ISRO and DRDO. Once you're a registered member, you can book distinct 1-on-1 sessions with them to get personalized guidance.";
                }
                else {
                    const fillers = [
                        "That's an interesting perspective. Could you tell me a bit more about that?",
                        "I understand. Building a venture involves many such moving parts. How are you planning to tackle the next step?",
                        "That makes sense. Innovation often requires navigating these kinds of complexities. Is there a specific hurdle you're facing right now?",
                        "I see. That's a crucial part of the process. I'd recommend looking into our 'Programs' section for more structured support on this."
                    ];
                    aiResponse = fillers[Math.floor(Math.random() * fillers.length)];
                }

                // Alert for admin 
                if (userMessage.toLowerCase().includes("language") || userMessage.toLowerCase().includes("hindi")) {
                    aiResponse += "\n\n*(Note: To enable true multilingual support and smarter answers, please set `VITE_GEMINI_API_KEY` in your .env file)*";
                }
            }

            if (!aiResponse) aiResponse = "I apologize, but I am unable to process that analysis right now.";

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                createdAt: Date.now()
            }]);

            // Try to log chat, but don't fail if it fails
            try {
                await supabase.from("ai_chat_logs").insert({
                    user_id: user?.id || null,
                    user_name: profile?.full_name || "Guest",
                    message: userMessage,
                    ai_response: aiResponse
                });
            } catch (e) { console.error("Failed to log chat", e); }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Connection interrupted. Please try again.",
                createdAt: Date.now()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[360px] md:w-[420px] h-[600px] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-black/80 backdrop-blur-xl ring-1 ring-white/5"
                    >
                        {/* Premium Header */}
                        <div className="p-4 bg-gradient-to-r from-gray-900 to-black border-b border-white/10 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm tracking-wide">BUSINESS BOT</h3>
                                    <p className="text-[10px] text-gray-400 font-medium">SAVISHKAR INTELLIGENCE</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gradient-to-b from-transparent to-black/50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-white/10" : "bg-primary/10"
                                            }`}>
                                            {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-primary" />}
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-[#1A1A1A] border border-white/5 text-gray-200 rounded-tl-none"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[85%]">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black/80 border-t border-white/10 backdrop-blur-md">
                            {/* Suggestions */}
                            {messages.length < 3 && !loading && (
                                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                                    {SUGGESTIONS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleSend(s)}
                                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-300 transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="relative flex items-center gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about business, funding, strategy..."
                                    className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-gray-500 rounded-xl pr-10"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || loading}
                                    className="absolute right-1 w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center justify-center h-14 w-14 rounded-full shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] bg-gradient-to-br from-primary to-purple-600 custom-glow"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <Bot className="w-7 h-7 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isOpen && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-black"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}
