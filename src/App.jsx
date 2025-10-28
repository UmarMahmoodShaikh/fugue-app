// client/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { Users, LogOut, Send, ArrowLeft } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('join'); // 'join', 'waiting', 'chatting', 'exited'
  const [username, setUsername] = useState('');
  const [partner, setPartner] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection — CONNECT ONCE
  useEffect(() => {
    // Use wss:// for HTTPS sites, ws:// for HTTP sites
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log('Connecting to WebSocket:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'waiting') {
        setStep('waiting');
      }
      else if (msg.type === 'paired') {
        setPartner(msg.partner);
        setStep('chatting');
      }
      else if (msg.type === 'chat') {
        // ✅ ALWAYS accept chat messages once paired
        // Don't check step — just add to messages
        setMessages(prev => [...prev, {
          text: msg.text,
          sender: msg.from,
          self: false
        }]);
      }
      else if (msg.type === 'partner-left') {
        alert('Your partner left the chat.');
        resetAndGoToJoin();
      }
      else if (msg.type === 'error') {
        alert(msg.message || 'An error occurred.');
        resetAndGoToJoin();
      }
    };

    ws.current.onopen = () => {
      console.log('WebSocket connected successfully');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed');
      if (step === 'chatting' || step === 'waiting') {
        setStep('exited');
        setTimeout(() => {
          alert('Disconnected.');
          resetAndGoToJoin();
        }, 1000);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // 👈 EMPTY DEPENDENCY ARRAY — CRITICAL!

  const resetAndGoToJoin = () => {
    setMessages([]);
    setUsername('');
    setPartner('');
    setStep('join');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Check if WebSocket is ready
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'join', username: username.trim() }));
    } else {
      alert('Connection not ready. Please wait...');
    }
  };

  const handleSend = () => {
    if (!input.trim() || step !== 'chatting') return;

    // Check if WebSocket is ready
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'chat', text: input.trim() }));
      setMessages(prev => [...prev, {
        text: input.trim(),
        sender: username,
        self: true
      }]);
      setInput('');
    } else {
      alert('Connection lost. Please refresh the page.');
    }
  };

  const handleLogout = () => {
    // Blur first
    setStep('exited');
    // Then close and reset
    setTimeout(() => {
      if (ws.current) {
        ws.current.close();
      }
      resetAndGoToJoin();
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'join') {
        handleJoin(e);
      } else if (step === 'chatting') {
        handleSend();
      }
    }
  };

  // JOIN SCREEN
  if (step === 'join') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-purple-400">Fugue</h1>
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded font-medium transition"
            >
              Start Anonymous Chat
            </button>
          </form>
          <p className="text-center text-gray-500 mt-6 text-sm">
            Chat with a stranger. Leave anytime — nothing is saved.
          </p>
        </div>
      </div>
    );
  }

  // WAITING SCREEN
  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <header className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-400">Fugue</h1>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white flex items-center gap-1"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Users size={48} className="text-purple-500 mb-4" />
          <h2 className="text-xl mb-2">Looking for someone...</h2>
          <p className="text-gray-500">You'll be paired instantly when someone joins.</p>
        </div>
      </div>
    );
  }

  // CHATTING SCREEN
  if (step === 'chatting') {
    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-900 relative">
        {/* Blur overlay when exiting */}
        {step === 'exited' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-lg z-50 flex items-center justify-center">
            <div className="text-white text-xl">Clearing chat...</div>
          </div>
        )}

        <header className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-purple-400">Fugue</h1>
            <p className="text-sm text-gray-400">Chatting with {partner}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-300 hover:text-red-400 transition"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.self ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'
                }`}
              >
                <div className="text-xs opacity-80 mb-1">{msg.sender}</div>
                <div>{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-purple-600 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EXITED SCREEN (blurred)
  if (step === 'exited') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex flex-col items-center">
          <div className="mb-4">Clearing chat...</div>
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
}