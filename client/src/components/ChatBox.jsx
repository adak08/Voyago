import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { useTripStore } from "../store/tripStore";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { tripService } from "../services/tripService";
import { format } from "date-fns";

export default function ChatBox({ tripId }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const { messages, setMessages, appendMessage } = useTripStore();
  const { user } = useAuthStore();
  const { sendMessage, sendTyping, typingUsers } = useSocketStore();
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await tripService.getMessages(tripId);
        setMessages(data.messages);
      } catch {}
      setLoading(false);
    };
    fetchMessages();
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(tripId, input.trim());
    setInput("");
    clearTimeout(typingTimer.current);
    sendTyping(tripId, false);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    sendTyping(tripId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(tripId, false), 1500);
  };

  const groupedMessages = groupByDate(messages);

  return (
    <div className="flex flex-col h-[620px] card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-surface-850 bg-white dark:bg-[var(--card)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <MessageCircle size={15} className="text-primary-500 dark:text-primary-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Group Chat</h3>
        </div>
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex gap-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            {typingUsers.map((u) => u.name).join(", ")} typing…
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[var(--bg-2)]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-600">
            <MessageCircle size={36} className="opacity-40" />
            <p className="text-sm">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center mb-4">
                <span className="text-xs bg-white dark:bg-surface-800 text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-surface-850 px-3 py-1 rounded-full shadow-sm">
                  {date}
                </span>
              </div>
              {msgs.map((msg) => {
                const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
                return (
                  <div key={msg._id} className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white mr-2.5 flex-shrink-0 mt-auto">
                        {msg.sender?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <span className="text-xs text-gray-400 dark:text-gray-600 mb-1 ml-1 font-medium">{msg.sender?.name}</span>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary-500 dark:bg-primary-500 text-white rounded-br-sm"
                          : "bg-white dark:bg-surface-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-50 dark:border-surface-850 rounded-bl-sm"
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 mx-1">
                        {format(new Date(msg.createdAt), "h:mm a")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend}
        className="px-4 py-3 bg-white dark:bg-[var(--card)] border-t border-gray-100 dark:border-surface-850 flex gap-2.5 flex-shrink-0">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Type a message…"
          value={input}
          onChange={handleTyping}
        />
        <button type="submit" disabled={!input.trim()}
          className="w-10 h-10 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

function groupByDate(messages) {
  return messages.reduce((acc, msg) => {
    const date = format(new Date(msg.createdAt), "MMMM d, yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});
}
