import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const USERS = [
  { id: 1, name: "Алиса Кошкина", username: "@alice_cat", avatar: "🐱", status: "online", lastSeen: "сейчас", unread: 3, role: "user" },
  { id: 2, name: "Борис Мурлыков", username: "@boris_purr", avatar: "🐯", status: "online", lastSeen: "сейчас", unread: 0, role: "user" },
  { id: 3, name: "Вика Хвостова", username: "@vika_tail", avatar: "🦁", status: "away", lastSeen: "5 мин назад", unread: 7, role: "user" },
  { id: 4, name: "Гриша Лапкин", username: "@grisha_paw", avatar: "🐻", status: "offline", lastSeen: "2 часа назад", unread: 0, role: "user" },
  { id: 5, name: "Даша Усова", username: "@dasha_whisker", avatar: "🦊", status: "online", lastSeen: "сейчас", unread: 12, role: "moderator" },
  { id: 6, name: "Егор Котов", username: "@egor_kot", avatar: "🐼", status: "offline", lastSeen: "вчера", unread: 0, role: "user" },
];

const CONVERSATIONS: Record<number, { from: number; text: string; time: string; read: boolean }[]> = {
  1: [
    { from: 1, text: "Привет! Как дела у тебя?", time: "10:05", read: true },
    { from: 0, text: "Всё отлично! Работаю над новым проектом 🚀", time: "10:07", read: true },
    { from: 1, text: "Звучит интересно! Расскажи подробнее", time: "10:08", read: true },
    { from: 0, text: "Мессенджер с крутым дизайном для котиков 🐱", time: "10:10", read: true },
    { from: 1, text: "Вау, это же Мяу Грамм! Я уже пользуюсь 😻", time: "10:12", read: false },
    { from: 1, text: "Кстати, когда будет тёмная тема?", time: "10:13", read: false },
    { from: 1, text: "И ещё хочу стикеры с котятами!", time: "10:14", read: false },
  ],
  2: [
    { from: 2, text: "Мяу! Проверка связи 🎉", time: "09:30", read: true },
    { from: 0, text: "Всё работает отлично!", time: "09:31", read: true },
    { from: 2, text: "Супер! Жду новых фич", time: "09:35", read: true },
  ],
  3: [
    { from: 3, text: "Привет всем! Новенький здесь 👋", time: "08:00", read: true },
    { from: 0, text: "Добро пожаловать в Мяу Грамм!", time: "08:05", read: true },
    { from: 3, text: "Как тут всё устроено?", time: "08:10", read: false },
    { from: 3, text: "Есть ли группы?", time: "08:11", read: false },
    { from: 3, text: "Можно создавать каналы?", time: "08:12", read: false },
    { from: 3, text: "И голосовые звонки тоже?", time: "08:13", read: false },
    { from: 3, text: "Сколько участников максимум?", time: "08:14", read: false },
  ],
  4: [
    { from: 4, text: "Когда будет обновление?", time: "вчера", read: true },
    { from: 0, text: "Скоро! Следите за новостями 😊", time: "вчера", read: true },
  ],
  5: [
    { from: 5, text: "Нужна помощь с настройками", time: "07:40", read: false },
    { from: 5, text: "Как изменить аватар?", time: "07:41", read: false },
    { from: 5, text: "И как отключить уведомления ночью?", time: "07:43", read: false },
    { from: 5, text: "Ещё вопрос — можно ли скрыть статус онлайн?", time: "07:45", read: false },
    { from: 5, text: "Буду ждать ответа!", time: "07:46", read: false },
    { from: 5, text: "Спасибо заранее 🙏", time: "07:47", read: false },
    { from: 5, text: "Очень крутое приложение кстати!", time: "07:48", read: false },
    { from: 5, text: "Уже советую всем друзьям", time: "07:49", read: false },
    { from: 5, text: "Вы большие молодцы!", time: "07:50", read: false },
    { from: 5, text: "Продолжайте в том же духе! ⭐⭐⭐⭐⭐", time: "07:51", read: false },
    { from: 5, text: "Жду ответа на вопросы выше", time: "07:52", read: false },
    { from: 5, text: "Спасибо!!!", time: "07:53", read: false },
  ],
  6: [
    { from: 6, text: "Привет!", time: "вчера", read: true },
    { from: 0, text: "Привет! Чем могу помочь?", time: "вчера", read: true },
  ],
};

type View = "chat" | "admin";

export default function Index() {
  const [view, setView] = useState<View>("chat");
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const [messages, setMessages] = useState(CONVERSATIONS);
  const [inputText, setInputText] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [adminTab, setAdminTab] = useState<"users" | "messages">("users");
  const [adminSelectedUser, setAdminSelectedUser] = useState(USERS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const totalUnread = USERS.reduce((s, u) => s + u.unread, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotif(true);
      setTimeout(() => setShowNotif(false), 4000);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      from: 0,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      read: true,
    };
    setMessages(prev => ({ ...prev, [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg] }));
    setInputText("");
  };

  const statusColor = (status: string) => {
    if (status === "online") return "bg-green-400 shadow-[0_0_8px_#4ade80]";
    if (status === "away") return "bg-yellow-400 shadow-[0_0_8px_#facc15]";
    return "bg-gray-500";
  };

  return (
    <div className="h-screen w-screen bg-mesh flex flex-col overflow-hidden relative">

      {/* Notification Toast */}
      {showNotif && (
        <div className="absolute top-4 right-4 z-50 animate-notification">
          <div className="glass rounded-2xl p-4 neon-glow-pink max-w-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐱</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Алиса Кошкина</p>
                <p className="text-xs text-white/60 truncate">написала новое сообщение</p>
              </div>
              <button onClick={() => setShowNotif(false)} className="text-white/40 hover:text-white/80">
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "chat" ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white neon-glow" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
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
        </div>
      </header>

      {/* CHAT VIEW */}
      {view === "chat" && (
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className="w-72 glass-dark border-r border-white/10 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-custom">
              {USERS.map((user) => {
                const userMsgs = messages[user.id] || [];
                const lastMsg = userMsgs[userMsgs.length - 1];
                const unreadCount = userMsgs.filter(m => m.from !== 0 && !m.read).length;
                const isSelected = selectedUser.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-3 py-3 transition-all hover:bg-white/5 ${isSelected ? "bg-gradient-to-r from-purple-600/20 to-cyan-600/10 border-r-2 border-purple-500" : ""}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${isSelected ? "neon-glow" : ""} bg-white/5`}>
                        {user.avatar}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d18] ${statusColor(user.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>{user.name}</span>
                        {lastMsg && <span className="text-[10px] text-white/30">{lastMsg.time}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-white/40 truncate">{lastMsg ? lastMsg.text : "Нет сообщений"}</span>
                        {unreadCount > 0 && (
                          <span className="notification-badge text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-1 flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="glass-dark border-b border-white/10 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">{selectedUser.avatar}</div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d18] ${statusColor(selectedUser.status)}`} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{selectedUser.name}</p>
                  <p className="text-xs text-white/40">{selectedUser.status === "online" ? "онлайн" : selectedUser.lastSeen}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-xl glass hover:neon-glow-cyan transition-all flex items-center justify-center text-white/40 hover:text-cyan-400">
                  <Icon name="Phone" size={15} />
                </button>
                <button className="w-8 h-8 rounded-xl glass hover:neon-glow-pink transition-all flex items-center justify-center text-white/40 hover:text-pink-400">
                  <Icon name="Video" size={15} />
                </button>
                <button className="w-8 h-8 rounded-xl glass hover:bg-white/10 transition-all flex items-center justify-center text-white/40 hover:text-white/80">
                  <Icon name="MoreVertical" size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-custom px-5 py-4 space-y-3">
              {(messages[selectedUser.id] || []).map((msg, i) => {
                const isAdmin = msg.from === 0;
                return (
                  <div key={i} className={`flex ${isAdmin ? "justify-end" : "justify-start"} animate-fade-slide-up`} style={{ animationDelay: `${i * 0.03}s`, animationFillMode: "both", opacity: 0 }}>
                    {!isAdmin && (
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end">
                        {selectedUser.avatar}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isAdmin ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
                      <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-white/30">{msg.time}</span>
                        {isAdmin && <Icon name={msg.read ? "CheckCheck" : "Check"} size={11} className={msg.read ? "text-cyan-400" : "text-white/30"} />}
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
          </div>
        </div>
      )}

      {/* ADMIN VIEW */}
      {view === "admin" && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
          <div className="grid grid-cols-4 gap-3 flex-shrink-0">
            {[
              { label: "Пользователей", value: USERS.length, icon: "Users", color: "from-purple-600 to-violet-600", glow: "neon-glow" },
              { label: "Онлайн", value: USERS.filter(u => u.status === "online").length, icon: "Wifi", color: "from-green-600 to-emerald-500", glow: "neon-glow-cyan" },
              { label: "Непрочитанных", value: totalUnread, icon: "MessageSquare", color: "from-pink-600 to-rose-500", glow: "neon-glow-pink" },
              { label: "Сообщений всего", value: Object.values(CONVERSATIONS).reduce((s, m) => s + m.length, 0), icon: "BarChart3", color: "from-cyan-600 to-blue-500", glow: "neon-glow-cyan" },
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
            </div>

            {adminTab === "users" && (
              <div className="flex-1 overflow-y-auto scrollbar-custom">
                <table className="w-full">
                  <thead className="sticky top-0 bg-black/40 backdrop-blur-sm">
                    <tr>
                      {["Пользователь", "Username", "Роль", "Статус", "Сообщений", "Непрочитано", "Действия"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {USERS.map((user, i) => {
                      const msgs = messages[user.id] || [];
                      const unread = msgs.filter(m => m.from !== 0 && !m.read).length;
                      return (
                        <tr
                          key={user.id}
                          className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-slide-up cursor-pointer ${adminSelectedUser.id === user.id ? "bg-purple-500/5" : ""}`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                          onClick={() => { setAdminSelectedUser(user); setAdminTab("messages"); }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg">{user.avatar}</div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d18] ${statusColor(user.status)}`} />
                              </div>
                              <span className="text-sm font-medium text-white">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/50">{user.username}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${user.role === "moderator" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}>
                              {user.role === "moderator" ? "Модератор" : "Участник"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${user.status === "online" ? "text-green-400" : user.status === "away" ? "text-yellow-400" : "text-white/30"}`}>
                              {user.status === "online" ? "● Онлайн" : user.status === "away" ? "● Отошёл" : "○ Оффлайн"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60">{msgs.length}</td>
                          <td className="px-4 py-3">
                            {unread > 0 ? (
                              <span className="notification-badge text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                {unread}
                              </span>
                            ) : (
                              <span className="text-xs text-white/20">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button className="w-7 h-7 rounded-lg glass hover:neon-glow transition-all flex items-center justify-center text-white/40 hover:text-purple-400">
                                <Icon name="Eye" size={13} />
                              </button>
                              <button className="w-7 h-7 rounded-lg glass hover:neon-glow-pink transition-all flex items-center justify-center text-white/40 hover:text-pink-400">
                                <Icon name="Ban" size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === "messages" && (
              <div className="flex-1 flex min-h-0">
                <div className="w-56 border-r border-white/10 overflow-y-auto scrollbar-custom flex-shrink-0">
                  {USERS.map(user => {
                    const unread = (messages[user.id] || []).filter(m => m.from !== 0 && !m.read).length;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setAdminSelectedUser(user)}
                        className={`w-full flex items-center gap-2.5 px-3 py-3 transition-all hover:bg-white/5 ${adminSelectedUser.id === user.id ? "bg-gradient-to-r from-cyan-600/15 to-transparent border-r-2 border-cyan-500" : ""}`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-base">{user.avatar}</div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0d0d18] ${statusColor(user.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-medium text-white/80 truncate">{user.name}</p>
                        </div>
                        {unread > 0 && (
                          <span className="notification-badge text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-base">{adminSelectedUser.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{adminSelectedUser.name}</p>
                      <p className="text-xs text-white/30">{adminSelectedUser.username} · {(messages[adminSelectedUser.id] || []).length} сообщений</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
                      <Icon name="Shield" size={12} />
                      <span>Режим просмотра</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-custom px-4 py-3 space-y-2.5">
                    {(messages[adminSelectedUser.id] || []).map((msg, i) => {
                      const isAdmin = msg.from === 0;
                      return (
                        <div key={i} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          {!isAdmin && (
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end">
                              {adminSelectedUser.avatar}
                            </div>
                          )}
                          <div className={`max-w-sm ${isAdmin ? "msg-bubble-out" : "msg-bubble-in"} px-3 py-2`}>
                            <p className="text-xs text-white/80 leading-relaxed">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-0.5 ${isAdmin ? "justify-end" : "justify-start"}`}>
                              <span className="text-[9px] text-white/25">{msg.time}</span>
                              <span className="text-[9px] text-white/25">{isAdmin ? "Администратор" : adminSelectedUser.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}