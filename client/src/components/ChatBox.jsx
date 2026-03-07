import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Paperclip } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { tripService } from "../services/tripService";
import { format } from "date-fns";

export default function ChatBox({ tripId }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuthStore();
  const {
    messages,
    setMessages,
    appendMessage,
    updateMessage,
    sendMessage,
    sendTyping,
    typingUsers,
    markMessagesSeen,
    addReaction,
    removeReaction,
  } = useSocketStore();
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await tripService.getMessages(tripId);
        setMessages(data.messages);
        markMessagesSeen(tripId);
      } catch {}
      setLoading(false);
    };
    fetchMessages();
  }, [tripId, setMessages, markMessagesSeen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const submitMessage = useCallback(
    ({ message = "", type = "text", mediaUrl = "", fileName = "" }) => {
      if (!tripId || !user?.id) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      appendMessage({
        _id: tempId,
        tempId,
        optimistic: true,
        sender: {
          _id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        tripId,
        type,
        message,
        mediaUrl,
        fileName,
        readBy: [user.id],
        reactions: [],
        createdAt: now,
      });

      sendMessage({ tripId, message, type, mediaUrl, fileName }, (ack) => {
        if (ack?.success && ack.message) {
          updateMessage(tempId, ack.message);
          return;
        }

        updateMessage(tempId, {
          _id: tempId,
          tempId,
          optimistic: false,
          failed: true,
          sender: {
            _id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
          tripId,
          type,
          message,
          mediaUrl,
          fileName,
          readBy: [user.id],
          reactions: [],
          createdAt: now,
        });
      });
    },
    [appendMessage, sendMessage, tripId, updateMessage, user],
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    submitMessage({ message: input.trim(), type: "text" });
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

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file || !tripId) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploaded = await tripService.uploadChatMedia(formData);
        const messageType = mapMimeToMessageType(uploaded.type || file.type);
        submitMessage({
          type: messageType,
          mediaUrl: uploaded.url,
          fileName: file.name,
          message: messageType === "file" ? file.name : "",
        });
      } catch {
      } finally {
        setUploading(false);
      }
    },
    [tripId, submitMessage],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
  });

  const groupedMessages = groupByDate(messages);
  const visibleTypingUsers = typingUsers.filter((u) => u.userId !== user?.id);

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col h-[620px] card overflow-hidden transition-colors ${
        isDragActive ? "ring-2 ring-primary-400" : ""
      }`}
    >
      <input {...getInputProps()} />
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-surface-850 bg-white dark:bg-[var(--card)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <MessageCircle
              size={15}
              className="text-primary-500 dark:text-primary-400"
            />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            Group Chat
          </h3>
        </div>
        {visibleTypingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            {visibleTypingUsers.map((u) => u.name).join(", ")} typing...
          </div>
        )}
      </div>

      {isDragActive && (
        <div className="px-4 py-2 text-xs text-center text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-900/30">
          Drop file to upload and send
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[var(--bg-2)]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-600">
            <MessageCircle size={36} className="opacity-40" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center mb-4">
                <span className="text-xs bg-white dark:bg-surface-800 text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-surface-850 px-3 py-1 rounded-full shadow-sm">
                  {date}
                </span>
              </div>
              {msgs.map((msg, idx) => {
                const isMe =
                  msg.sender?._id === user?.id || msg.sender === user?.id;
                return (
                  <div
                    key={`${msg._id || msg.tempId || "msg"}-${idx}`}
                    className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white mr-2.5 flex-shrink-0 mt-auto">
                        {msg.sender?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {!isMe && (
                        <span className="text-xs text-gray-400 dark:text-gray-600 mb-1 ml-1 font-medium">
                          {msg.sender?.name}
                        </span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-primary-500 dark:bg-primary-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-surface-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-50 dark:border-surface-850 rounded-bl-sm"
                        }`}
                      >
                        {renderMessageContent(msg)}
                      </div>

                      {msg._id && !String(msg._id).startsWith("temp-") && (
                        <div className="flex items-center gap-1 mt-1">
                          {["👍", "❤️", "😂"].map((emoji) => {
                            const mine = (msg.reactions || []).find(
                              (r) =>
                                (r.userId?._id || r.userId)?.toString?.() ===
                                  user?.id && r.emoji === emoji,
                            );
                            const count = (msg.reactions || []).filter(
                              (r) => r.emoji === emoji,
                            ).length;

                            return (
                              <button
                                key={`${msg._id}-${emoji}`}
                                type="button"
                                onClick={() => {
                                  if (mine) removeReaction(tripId, msg._id);
                                  else addReaction(tripId, msg._id, emoji);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border transition-all font-medium
                              ${
                                mine
                                  ? "bg-primary-500 border-primary-500 text-white"
                                  : "bg-white dark:bg-surface-900 border-gray-200 dark:border-surface-700 text-gray-700 dark:text-gray-300"
                              }`}
                              >
                                {emoji}
                                {count > 0 && (
                                  <span className="ml-1 text-gray-800 dark:text-gray-200 font-medium">
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <span className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 mx-1">
                        {format(new Date(msg.createdAt), "h:mm a")}
                        {isMe && !msg.failed && (msg.readBy || []).length > 1
                          ? " Seen"
                          : ""}
                        {msg.optimistic ? " Sending..." : ""}
                        {msg.failed ? " Failed" : ""}
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
      <form
        onSubmit={handleSend}
        className="px-4 py-3 bg-white dark:bg-[var(--card)] border-t border-gray-100 dark:border-surface-850 flex gap-2.5 flex-shrink-0"
      >
        <button
          type="button"
          onClick={open}
          disabled={uploading}
          className="w-10 h-10 border border-gray-200 dark:border-surface-700 text-gray-500 dark:text-gray-300 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
        >
          <Paperclip size={15} />
        </button>
        <input
          type="text"
          className="input-field flex-1"
          placeholder={uploading ? "Uploading file..." : "Type a message..."}
          value={input}
          onChange={handleTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || uploading}
          className="w-10 h-10 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
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

function mapMimeToMessageType(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

function renderMessageContent(msg) {
  if (msg.type === "image") {
    return (
      <img
        src={msg.mediaUrl}
        alt={msg.fileName || "image"}
        className="rounded-xl max-h-64 w-auto"
      />
    );
  }

  if (msg.type === "video") {
    return (
      <video
        src={msg.mediaUrl}
        controls
        className="rounded-xl max-h-64 w-auto"
      />
    );
  }

  if (msg.type === "audio") {
    return <audio src={msg.mediaUrl} controls className="w-64 max-w-full" />;
  }

  if (msg.type === "file") {
    const label = msg.fileName || msg.message || "Download file";
    return (
      <a
        href={msg.mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="underline font-medium"
      >
        {label}
      </a>
    );
  }

  return msg.message;
}
