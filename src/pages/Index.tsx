import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/2fcfb44d-562a-4060-9ee8-6b54dc96a31f";
const USERS_URL = "https://functions.poehali.dev/57050f1a-6836-4f1c-bdff-a2abc61750a8";
const MESSAGES_URL = "https://functions.poehali.dev/8737eecc-125b-4383-882f-3ab17d40b0cb";

const AVATARS = ["🐱", "🐯", "🦁", "🐻", "🦊", "🐼", "🐸", "🐧", "🦋", "🦄"];

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  role: string;
  status: string;
  last_seen?: string;
  unread?: number;
  message_count?: number;
}

interface Message {
  id: number;
  from: number;
  to: number;
  text: string;
  read: boolean;
  time: string;
}

interface Chat {
  user: User;
  last_message: { text: string; time: string } | null;
  unread: number;
}

type Screen = "auth" | "chat" | "admin";
type AuthMode = "login" | "register";

const statusColor = (status: string) => {
  if (status === "online") return "bg-green-400 shadow-[0_0_8px_#4ade80]";
  if (status === "away") return "bg-yellow-400 shadow-[0_0_8px_#facc15]";
  return "bg-gray-500";
};

function api(url: string, opts: RequestInit = {}, token?: string) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Auth-Token": token } : {}),
      ...(opts.headers || {}),
    },
  }).then(r => r.json());
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ username: "", display_name: "", password: "", avatar: AVATARS[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    const endpoint = mode === "login" ? `${AUTH_URL}/login` : `${AUTH_URL}/register`;
    const res = await api(endpoint, { method: "POST", body: JSON.stringify(form) });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    localStorage.setItem("mg_token", res.token);
    onLogin(res.token, res.user);
  };

  return (
    <div className="h-screen w-screen bg-mesh flex items-center justify-center">
      <div className="glass rounded-3xl p-8 w-full max-w-sm neon-glow animate-fade-slide-up">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-3xl mx-auto mb-3 neon-glow animate-float">
            🐱
          </div>
          <h1 className="font-caveat text-3xl gradient-text font-bold">Мяу Грамм</h1>
          <p className="text-xs text-white/40 mt-1">мессенджер для своих</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-5">
          {(["login", "register"] as AuthMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium transition-all ${mode === m ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {m === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-xs text-white/40 mb-1 block">Имя</label>
              <input
                value={form.display_name}
                onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                placeholder="Алиса Кошкина"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Логин</label>
            <input
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="alice_cat"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••"
              onKeyDown={e => e.key === "Enter" && submit()}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs text-white/40 mb-2 block">Аватар</label>
              <div className="flex gap-2 flex-wrap">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setForm(p => ({ ...p, avatar: a }))}
                    className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${form.avatar === a ? "bg-purple-600/40 border border-purple-500 neon-glow" : "bg-white/5 hover:bg-white/10"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-xl py-2">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-sm neon-glow hover:scale-[1.02] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function Index() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [token, setToken] = useState("");
  const [me, setMe] = useState<User | null>(null);
  const [view, setView] = useState<"chat" | "admin">("chat");

  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [notification, setNotification] = useState<{ user: User; text: string } | null>(null);

  // Admin state
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminTab, setAdminTab] = useState<"users" | "messages">("users");
  const [adminSelectedUser, setAdminSelectedUser] = useState<User | null>(null);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-login
  useEffect(() => {
    const saved = localStorage.getItem("mg_token");
    if (!saved) return;
    api(AUTH_URL, {}, saved).then(res => {
      if (res.id) { setToken(saved); setMe(res); setScreen("chat"); }
      else localStorage.removeItem("mg_token");
    });
  }, []);

  const handleLogin = (tok: string, user: User) => {
    setToken(tok);
    setMe(user);
    setScreen("chat");
  };

  const handleLogout = async () => {
    await api(`${AUTH_URL}/logout`, { method: "POST" }, token);
    localStorage.removeItem("mg_token");
    setToken(""); setMe(null); setScreen("auth");
  };

  // Load chats
  const loadChats = useCallback(async () => {
    if (!token) return;
    const data = await api(MESSAGES_URL, {}, token);
    if (Array.isArray(data)) setChats(data);
  }, [token]);

  // Load all users (for new chat)
  const loadAllUsers = useCallback(async () => {
    if (!token) return;
    const data = await api(USERS_URL, {}, token);
    if (data.users) setAllUsers(data.users);
  }, [token]);

  useEffect(() => {
    if (screen === "chat") {
      loadChats();
      loadAllUsers();
      pollRef.current = setInterval(loadChats, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [screen, loadChats, loadAllUsers]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat || !token) return;
    api(`${MESSAGES_URL}?with=${selectedChat.id}`, {}, token).then(data => {
      if (Array.isArray(data)) setMessages(data);
    });
    // Mark as read
    api(`${MESSAGES_URL}/read`, { method: "POST", body: JSON.stringify({ from_user_id: selectedChat.id }) }, token);
  }, [selectedChat, token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling — check for new messages and show notification
  useEffect(() => {
    if (screen !== "chat" || !token) return;
    const interval = setInterval(async () => {
      const data = await api(MESSAGES_URL, {}, token);
      if (!Array.isArray(data)) return;
      setChats(prev => {
        const newChats = data as Chat[];
        // Check for new messages
        newChats.forEach(nc => {
          const old = prev.find(c => c.user.id === nc.user.id);
          if (nc.unread > 0 && (!old || nc.unread > (old.unread || 0)) && selectedChat?.id !== nc.user.id) {
            setNotification({ user: nc.user, text: nc.last_message?.text || "новое сообщение" });
            setTimeout(() => setNotification(null), 4000);
          }
        });
        return newChats;
      });
      // Refresh current chat
      if (selectedChat) {
        api(`${MESSAGES_URL}?with=${selectedChat.id}`, {}, token).then(msgs => {
          if (Array.isArray(msgs)) setMessages(msgs);
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [screen, token, selectedChat]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;
    const text = inputText.trim();
    setInputText("");
    const res = await api(MESSAGES_URL, {
      method: "POST",
      body: JSON.stringify({ to_user_id: selectedChat.id, text }),
    }, token);
    if (res.id) setMessages(prev => [...prev, res]);
    loadChats();
  };

  // Load admin users
  const loadAdminUsers = useCallback(async () => {
    if (!token) return;
    const data = await api(`${USERS_URL}?admin=1`, {}, token);
    if (data.users) setAdminUsers(data.users);
  }, [token]);

  useEffect(() => {
    if (view === "admin") loadAdminUsers();
  }, [view, loadAdminUsers]);

  const loadAdminMessages = async (user: User) => {
    setAdminSelectedUser(user);
    setAdminTab("messages");
    const data = await api(`${MESSAGES_URL}?with=${user.id}`, {}, token);
    if (Array.isArray(data)) setAdminMessages(data);
  };

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);
  const filteredChats = searchText
    ? chats.filter(c => c.user.display_name.toLowerCase().includes(searchText.toLowerCase()))
    : chats;
  const filteredUsers = allUsers.filter(u =>
    u.id !== me?.id &&
    u.display_name.toLowerCase().includes(searchText.toLowerCase()) &&
    !chats.find(c => c.user.id === u.id)
  );

  if (screen === "auth") return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen bg-mesh flex flex-col overflow-hidden relative">

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-4 right-4 z-50 animate-notification">
          <div className="glass rounded-2xl p-4 neon-glow-pink max-w-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{notification.user.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{notification.user.display_name}</p>
                <p className="text-xs text-white/60 truncate">{notification.text}</p>
              </div>
              <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white/80">
                <Icon name="X" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="glass-dark border-b border-white/10 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-lg neon-glow animate-float">
            🐱
          </div>
          <div>
            <h1 className="font-caveat text-2xl gradient-text font-bold leading-none">Мяу Грамм</h1>
            <p className="text-[10px] text-white/40">мессенджер для своих</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("chat")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "chat" && screen === "chat" ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white neon-glow" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
          >
            <Icon name="MessageCircle" size={15} className="inline mr-1.5 -mt-0.5" />
            Чаты
          </button>
          <button
            onClick={() => setView("admin")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${view === "admin" ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white neon-glow-pink" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
          >
            <Icon name="Shield" size={15} className="inline mr-1.5 -mt-0.5" />
            Админ
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 notification-badge text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-base">{me?.avatar}</div>
            <span className="text-xs text-white/60 hidden sm:block">{me?.display_name}</span>
          </div>
          <button onClick={handleLogout} className="w-8 h-8 rounded-xl glass hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
            <Icon name="LogOut" size={14} />
          </button>
        </div>
      </header>

      {/* ── CHAT VIEW ── */}
      {view === "chat" && (
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className="w-72 glass-dark border-r border-white/10 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-white/5 flex gap-2">
              <div className="relative flex-1">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); setShowNewChat(e.target.value.length > 0); }}
                  placeholder="Поиск / новый чат..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
              <button
                onClick={() => { setShowNewChat(!showNewChat); setSearchText(""); }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/50 to-cyan-600/40 flex items-center justify-center text-white/70 hover:text-white neon-glow transition-all"
              >
                <Icon name="Plus" size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-custom">
              {/* Existing chats */}
              {filteredChats.length === 0 && !showNewChat && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                  <span className="text-4xl mb-3 animate-float">🐾</span>
                  <p className="text-sm font-medium text-white/50">Нет чатов</p>
                  <p className="text-xs text-white/25 mt-1">Нажми + чтобы начать общение</p>
                </div>
              )}

              {filteredChats.map((chat) => {
                const isSelected = selectedChat?.id === chat.user.id;
                return (
                  <button
                    key={chat.user.id}
                    onClick={() => { setSelectedChat(chat.user); setShowNewChat(false); setSearchText(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 transition-all hover:bg-white/5 ${isSelected ? "bg-gradient-to-r from-purple-600/20 to-cyan-600/10 border-r-2 border-purple-500" : ""}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${isSelected ? "neon-glow" : ""} bg-white/5`}>
                        {chat.user.avatar}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d18] ${statusColor(chat.user.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>{chat.user.display_name}</span>
                        {chat.last_message && <span className="text-[10px] text-white/30">{chat.last_message.time}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-white/40 truncate">{chat.last_message?.text || "Нет сообщений"}</span>
                        {chat.unread > 0 && (
                          <span className="notification-badge text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-1 flex-shrink-0">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* New chat — users not in chats */}
              {(showNewChat || searchText) && filteredUsers.length > 0 && (
                <div className="border-t border-white/5">
                  <p className="text-[10px] text-white/25 px-3 py-2 uppercase tracking-wider">Начать чат</p>
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => { setSelectedChat(user); setShowNewChat(false); setSearchText(""); setMessages([]); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg flex-shrink-0">{user.avatar}</div>
                      <div className="text-left">
                        <p className="text-sm text-white/80">{user.display_name}</p>
                        <p className="text-xs text-white/30">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedChat ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <span className="text-6xl mb-4 animate-float">🐱</span>
                <h2 className="font-caveat text-3xl gradient-text font-bold mb-2">Добро пожаловать!</h2>
                <p className="text-sm text-white/40">Выбери чат слева или начни новый</p>
              </div>
            ) : (
              <>
                <div className="glass-dark border-b border-white/10 px-5 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">{selectedChat.avatar}</div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d18] ${statusColor(selectedChat.status)}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{selectedChat.display_name}</p>
                      <p className="text-xs text-white/40">{selectedChat.status === "online" ? "онлайн" : selectedChat.last_seen || "оффлайн"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-xl glass hover:neon-glow-cyan transition-all flex items-center justify-center text-white/40 hover:text-cyan-400">
                      <Icon name="Phone" size={15} />
                    </button>
                    <button className="w-8 h-8 rounded-xl glass hover:neon-glow-pink transition-all flex items-center justify-center text-white/40 hover:text-pink-400">
                      <Icon name="Video" size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-custom px-5 py-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <span className="text-4xl mb-2 opacity-40">{selectedChat.avatar}</span>
                      <p className="text-sm text-white/25">Напиши первое сообщение!</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.from === me?.id;
                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-slide-up`} style={{ animationDelay: `${Math.min(i, 10) * 0.03}s`, animationFillMode: "both", opacity: 0 }}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end">
                            {selectedChat.avatar}
                          </div>
                        )}
                        <div className={`max-w-xs lg:max-w-md ${isMe ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
                          <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className="text-[10px] text-white/30">{msg.time}</span>
                            {isMe && <Icon name={msg.read ? "CheckCheck" : "Check"} size={11} className={msg.read ? "text-cyan-400" : "text-white/30"} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="glass-dark border-t border-white/10 p-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="w-9 h-9 rounded-xl glass hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all flex-shrink-0">
                      <Icon name="Paperclip" size={16} />
                    </button>
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Написать сообщение..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <button className="w-9 h-9 rounded-xl glass hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all flex-shrink-0">
                      <Icon name="Smile" size={16} />
                    </button>
                    <button
                      onClick={sendMessage}
                      className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white neon-glow hover:scale-105 transition-all flex-shrink-0"
                    >
                      <Icon name="Send" size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN VIEW ── */}
      {view === "admin" && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
          <div className="grid grid-cols-4 gap-3 flex-shrink-0">
            {[
              { label: "Пользователей", value: adminUsers.length, icon: "Users", color: "from-purple-600 to-violet-600", glow: "neon-glow" },
              { label: "Онлайн", value: adminUsers.filter(u => u.status === "online").length, icon: "Wifi", color: "from-green-600 to-emerald-500", glow: "neon-glow-cyan" },
              { label: "Непрочитанных", value: totalUnread, icon: "MessageSquare", color: "from-pink-600 to-rose-500", glow: "neon-glow-pink" },
              { label: "Сообщений всего", value: adminUsers.reduce((s, u) => s + (u.message_count || 0), 0), icon: "BarChart3", color: "from-cyan-600 to-blue-500", glow: "neon-glow-cyan" },
            ].map((stat, i) => (
              <div key={i} className={`glass rounded-2xl p-4 ${stat.glow} animate-fade-slide-up`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon name={stat.icon} size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="flex border-b border-white/10 flex-shrink-0">
              <button
                onClick={() => setAdminTab("users")}
                className={`px-6 py-3 text-sm font-medium transition-all ${adminTab === "users" ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/5" : "text-white/40 hover:text-white/70"}`}
              >
                <Icon name="Users" size={14} className="inline mr-1.5 -mt-0.5" />
                Пользователи
              </button>
              <button
                onClick={() => setAdminTab("messages")}
                className={`px-6 py-3 text-sm font-medium transition-all ${adminTab === "messages" ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/5" : "text-white/40 hover:text-white/70"}`}
              >
                <Icon name="MessageSquare" size={14} className="inline mr-1.5 -mt-0.5" />
                Переписка
              </button>
              <button onClick={loadAdminUsers} className="ml-auto mr-3 my-2 px-3 rounded-xl glass text-xs text-white/40 hover:text-white/70 transition-all">
                <Icon name="RefreshCw" size={12} className="inline mr-1 -mt-0.5" />
                Обновить
              </button>
            </div>

            {adminTab === "users" && (
              <div className="flex-1 overflow-y-auto scrollbar-custom">
                {adminUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <span className="text-4xl mb-3 opacity-30">👤</span>
                    <p className="text-sm text-white/30">Нет зарегистрированных пользователей</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-black/40 backdrop-blur-sm">
                      <tr>
                        {["Пользователь", "Username", "Роль", "Статус", "Сообщений", "Непрочитано", "Действия"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user, i) => (
                        <tr
                          key={user.id}
                          className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-slide-up cursor-pointer ${adminSelectedUser?.id === user.id ? "bg-purple-500/5" : ""}`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                          onClick={() => loadAdminMessages(user)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg">{user.avatar}</div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d18] ${statusColor(user.status)}`} />
                              </div>
                              <span className="text-sm font-medium text-white">{user.display_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/50">@{user.username}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${user.role === "admin" ? "bg-pink-500/15 text-pink-400 border border-pink-500/30" : user.role === "moderator" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}>
                              {user.role === "admin" ? "Админ" : user.role === "moderator" ? "Модератор" : "Участник"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${user.status === "online" ? "text-green-400" : "text-white/30"}`}>
                              {user.status === "online" ? "● Онлайн" : "○ Оффлайн"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60">{user.message_count || 0}</td>
                          <td className="px-4 py-3">
                            {(user.unread || 0) > 0 ? (
                              <span className="notification-badge text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                {user.unread}
                              </span>
                            ) : (
                              <span className="text-xs text-white/20">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button className="w-7 h-7 rounded-lg glass hover:neon-glow transition-all flex items-center justify-center text-white/40 hover:text-purple-400">
                              <Icon name="Eye" size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {adminTab === "messages" && (
              <div className="flex-1 flex min-h-0">
                <div className="w-56 border-r border-white/10 overflow-y-auto scrollbar-custom flex-shrink-0">
                  {adminUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => loadAdminMessages(user)}
                      className={`w-full flex items-center gap-2.5 px-3 py-3 transition-all hover:bg-white/5 ${adminSelectedUser?.id === user.id ? "bg-gradient-to-r from-cyan-600/15 to-transparent border-r-2 border-cyan-500" : ""}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-base">{user.avatar}</div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0d0d18] ${statusColor(user.status)}`} />
                      </div>
                      <p className="text-xs font-medium text-white/80 truncate flex-1 text-left">{user.display_name}</p>
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  {!adminSelectedUser ? (
                    <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                      Выбери пользователя
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-base">{adminSelectedUser.avatar}</div>
                        <div>
                          <p className="text-sm font-semibold text-white">{adminSelectedUser.display_name}</p>
                          <p className="text-xs text-white/30">@{adminSelectedUser.username} · {adminMessages.length} сообщений</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
                          <Icon name="Shield" size={12} />
                          <span>Режим просмотра</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto scrollbar-custom px-4 py-3 space-y-2.5">
                        {adminMessages.length === 0 && (
                          <div className="flex items-center justify-center h-full text-white/20 text-sm">Нет сообщений</div>
                        )}
                        {adminMessages.map((msg, i) => {
                          const isFromUser = msg.from === adminSelectedUser.id;
                          return (
                            <div key={msg.id || i} className={`flex ${isFromUser ? "justify-start" : "justify-end"}`}>
                              {isFromUser && (
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end">
                                  {adminSelectedUser.avatar}
                                </div>
                              )}
                              <div className={`max-w-sm ${isFromUser ? "msg-bubble-in" : "msg-bubble-out"} px-3 py-2`}>
                                <p className="text-xs text-white/80 leading-relaxed">{msg.text}</p>
                                <div className={`flex items-center gap-1 mt-0.5 ${isFromUser ? "justify-start" : "justify-end"}`}>
                                  <span className="text-[9px] text-white/25">{msg.time}</span>
                                  <span className="text-[9px] text-white/25">{isFromUser ? adminSelectedUser.display_name : "Другой пользователь"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
