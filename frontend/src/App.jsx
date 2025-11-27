// client/src/App.jsx
import { useEffect, useRef, useState } from 'react';
import { Users, LogOut, Send, ArrowLeft, Loader2, DoorOpen } from 'lucide-react';

const inferBackendOrigin = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  const { protocol, hostname, port } = window.location;
  if (port === '5173') {
    return `${protocol}//${hostname}:8080`;
  }
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
};

const API_BASE = inferBackendOrigin();

const inferWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const { hostname, port } = window.location;
  
  // dev
  if (port === '5173') {
    return `${wsProtocol}//${hostname}:8080`;
  }
  
  // prod
  return `${wsProtocol}//${hostname}${port ? `:${port}` : ''}/ws`;
};

const WS_URL = inferWebSocketUrl();

const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const payload = hasJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    const error = new Error(payload.error || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export default function App() {
  const [loadingSession, setLoadingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [interests, setInterests] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [pendingInterestIds, setPendingInterestIds] = useState([]);
  const [selectedInterestId, setSelectedInterestId] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [savingInterests, setSavingInterests] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [step, setStep] = useState('prepare'); // 'prepare' | 'waiting' | 'chatting'
  const [waitingInfo, setWaitingInfo] = useState(null);
  const [partner, setPartner] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [extendOffered, setExtendOffered] = useState(false);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [me, interestsList] = await Promise.allSettled([
          apiRequest('/api/me'),
          apiRequest('/api/interests')
        ]);

        if (interestsList.status === 'fulfilled') {
          setInterests(interestsList.value.interests || []);
        }

        if (me.status === 'fulfilled') {
          const sessionUser = me.value.user;
          const sessionInterests = me.value.interests || [];
          setUser(sessionUser);
          setUserInterests(sessionInterests);
          const ids = sessionInterests.map((interest) => interest.id);
          setPendingInterestIds(ids);
          setSelectedInterestId(ids[0] ? String(ids[0]) : '');
        } else if (me.status === 'rejected' && me.reason?.status === 401) {
          setUser(null);
        } else if (me.status === 'rejected') {
          console.error('Failed to load session:', me.reason);
        }
      } catch (error) {
        console.error('Unexpected session load error:', error);
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'waiting') {
        setInfoMessage('');
        setWaitingInfo({
          message: msg.message,
          interestName: msg.interestName,
          queue: msg.queue
        });
        setStep('waiting');
        setExtendOffered(Boolean(msg.canExtend));
      } else if (msg.type === 'paired') {
        setInfoMessage('');
        setPartner(msg.partner);
        setWaitingInfo(null);
        setMessages([]);
        setExtendOffered(false);
        setStep('chatting');
      } else if (msg.type === 'chat') {
        setMessages((prev) => [
          ...prev,
          { text: msg.text, sender: msg.from, self: false }
        ]);
      } else if (msg.type === 'partner-left') {
        setPartner('');
        setMessages([]);
        setWaitingInfo(null);
        setStep('prepare');
        setInfoMessage('Your partner left the chat.');
      } else if (msg.type === 'waiting-cancelled') {
        setStep('prepare');
        setWaitingInfo(null);
        setExtendOffered(false);
        setInfoMessage('Search cancelled.');
      } else if (msg.type === 'left-room') {
        setPartner('');
        setMessages([]);
        setWaitingInfo(null);
        setExtendOffered(false);
        setStep('prepare');
        setInfoMessage(msg.message || 'You left the chat.');
      } else if (msg.type === 'error') {
        setStep('prepare');
        setWaitingInfo(null);
        setExtendOffered(false);
        setInfoMessage(msg.message || 'Unexpected error.');
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      wsRef.current = null;
      setStep('prepare');
      setWaitingInfo(null);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');

    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    try {
      const payload = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm)
      });

      setUser(payload.user);
      const sessionInterests = payload.interests || [];
      setUserInterests(sessionInterests);
      const ids = sessionInterests.map((interest) => interest.id);
      setPendingInterestIds(ids);
      setSelectedInterestId(ids[0] ? String(ids[0]) : '');
      setAuthForm({ username: '', password: '' });
      setAuthError('');
    } catch (error) {
      setAuthError(error.payload?.error || error.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setUser(null);
    setMessages([]);
    setPartner('');
    setStep('prepare');
    setWaitingInfo(null);
    setExtendOffered(false);
    setPendingInterestIds([]);
    setUserInterests([]);
    setInfoMessage('');
  };

  const toggleInterest = (interestId) => {
    setPendingInterestIds((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      }
      return [...prev, interestId];
    });
  };

  const saveInterests = async () => {
    setSavingInterests(true);
    setSaveMessage('');
    try {
      const payload = await apiRequest('/api/user/interests', {
        method: 'POST',
        body: JSON.stringify({ interestIds: pendingInterestIds })
      });
      const updated = payload.interests || [];
      setUserInterests(updated);
      setSelectedInterestId(updated[0] ? String(updated[0].id) : '');
      setSaveMessage('Preferences saved.');
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      setSaveMessage(error.payload?.error || 'Failed to save interests.');
    } finally {
      setSavingInterests(false);
    }
  };

  const canChat = pendingInterestIds.length > 0 && userInterests.length > 0;

  const handleJoin = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Connection is not ready. Please wait a moment.');
      return;
    }
    if (!selectedInterestId) {
      alert('Select an interest to start chatting.');
      return;
    }
    wsRef.current.send(
      JSON.stringify({ type: 'join', interestId: Number(selectedInterestId) })
    );
    setMessages([]);
    setPartner('');
    setInfoMessage('');
  };

  const handleExtendSearch = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'extend-search' }));
    setExtendOffered(false);
  };

  const handleCancelWaiting = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'cancel-waiting' }));
  };

  const handleLeaveChat = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'leave-room' }));
  };

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat', text }));
    setMessages((prev) => [...prev, { text, sender: user.username, self: true }]);
    setChatInput('');
  };

  const handleChatKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (step === 'chatting') {
        handleChatSend();
      }
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-300">
          <Loader2 className="animate-spin" size={32} />
          <p>Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Fugue</h1>
          <div className="flex justify-center gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                authMode === 'login'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
            >
              Login
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                authMode === 'signup'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
              }}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            <input
              value={authForm.username}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="Username"
              autoComplete="username"
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Password"
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {authError && <div className="text-sm text-red-400">{authError}</div>}
            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded font-medium transition disabled:opacity-50"
            >
              {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const interestLookup = new Map(interests.map((interest) => [interest.id, interest.name]));
  const selectedInterestName =
    selectedInterestId && interestLookup.get(Number(selectedInterestId));

  const showInterestWarning = userInterests.length === 0;

  const InfoBanner = ({ message }) => (
    <div className="mb-3 p-3 border border-blue-500/60 bg-blue-500/10 text-blue-200 rounded">
      {message}
    </div>
  );

  if (step === 'chatting') {
    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-900">
        <header className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-purple-400">Fugue</h1>
            <p className="text-sm text-gray-400">
              Chatting with {partner}
              {selectedInterestName ? ` • Topic: ${selectedInterestName}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLeaveChat}
              className="flex items-center gap-2 px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 hover:bg-yellow-500/20 hover:border-yellow-400 hover:text-yellow-200 transition"
              title="Leave chat"
            >
              <DoorOpen size={16} />
              <span className="text-sm font-medium">Leave</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-gray-300 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </header>

        {infoMessage && (
          <div className="px-4 pt-4">
            <InfoBanner message={infoMessage} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.self ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.self ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'
                }`}
              >
                <div className="text-xs opacity-80 mb-1">{message.sender}</div>
                <div>{message.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              className="bg-purple-600 text-white px-4 rounded-lg disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <header className="p-4 border-b border-gray-800 flex justify-between items-center">
          <button
            onClick={handleCancelWaiting}
            className="flex items-center gap-1 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white flex items-center gap-1"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
          {infoMessage && <InfoBanner message={infoMessage} />}
          <Users size={48} className="text-purple-500" />
          <h2 className="text-xl font-semibold text-white">Looking for someone...</h2>
          <p className="text-gray-400">
            {waitingInfo?.message || "We'll pair you as soon as someone is available."}
          </p>
          {extendOffered && (
            <button
              onClick={handleExtendSearch}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
            >
              Extend search to anyone
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-purple-400">Fugue</h1>
          <p className="text-sm text-gray-400">Welcome back, {user.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-gray-300 hover:text-red-400 transition"
        >
          <LogOut size={16} />
          <span className="text-sm">Logout</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 max-w-5xl w-full mx-auto">
        <section className="md:w-1/2 bg-gray-950 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Your interests</h2>
          {infoMessage && <InfoBanner message={infoMessage} />}
          <p className="text-sm text-gray-400 mb-4">
            Select the topics you enjoy. We'll match you with people who choose the same
            interest.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {interests.map((interest) => {
              const checked = pendingInterestIds.includes(interest.id);
              return (
                <label
                  key={interest.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                    checked
                      ? 'border-purple-500 bg-purple-900/30 text-purple-100'
                      : 'border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-purple-500"
                    checked={checked}
                    onChange={() => toggleInterest(interest.id)}
                  />
                  <span>{interest.name}</span>
                </label>
              );
            })}
            {interests.length === 0 && (
              <div className="text-gray-500 text-sm">No interests configured yet.</div>
            )}
          </div>
          <button
            onClick={saveInterests}
            disabled={savingInterests}
            className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {savingInterests ? 'Saving...' : 'Save preferences'}
          </button>
          {saveMessage && <p className="text-sm text-gray-300 mt-2">{saveMessage}</p>}
        </section>

        <section className="md:w-1/2 bg-gray-950 border border-gray-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-3">Start chatting</h2>
          {showInterestWarning && (
            <div className="mb-4 p-3 border border-yellow-500/60 bg-yellow-500/10 text-yellow-200 rounded">
              Add at least one interest to start matching with people.
            </div>
          )}
          {userInterests.length > 0 && (
            <>
              <label className="text-sm text-gray-400 mb-2">Choose an interest</label>
              <select
                value={selectedInterestId}
                onChange={(event) => setSelectedInterestId(event.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select an interest</option>
                {userInterests.map((interest) => (
                  <option key={interest.id} value={interest.id}>
                    {interest.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleJoin}
                disabled={!canChat || !selectedInterestId}
                className="mt-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Find someone to chat with
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}