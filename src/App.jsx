import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FaCommentDots } from 'react-icons/fa';
import './App.css';
import ReactMarkdown from 'react-markdown';


function getOrCreateUserId() {
  const createChat = async (user_id) => {
    console.log(user_id);
    await fetch('http://localhost:5000/create_chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user_id }),
    });
  };

  let userId = Cookies.get('userId');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substr(2, 9);
    Cookies.set('userId', userId, { expires: 365 });
  }
  createChat(userId);
  return userId;
}

function ChatPopup({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener mensajes del historial al montar el componente
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/get_messages/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.messages.map((msg) => ({
            sender: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.content,
          }));
          setMessages(formattedMessages.reverse());
        } else {
          console.warn('No se encontraron mensajes previos.');
        }
      } catch (error) {
        console.error('Error al cargar los mensajes:', error);
      }
    };
    fetchMessages();
  }, [userId]);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: userMessage }];
    setMessages(newMessages);

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: userMessage }),
      });

      const data = await response.json();
      setMessages([...newMessages, { sender: 'assistant', text: data.assistant_message }]);
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    } finally {
      setIsLoading(false);
    }

    setUserMessage(''); // Limpiar el input
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      <div className={`chat-icon ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <FaCommentDots size={30} />
      </div>
      {isOpen && (
        <div className="chat-popup">
          <div className="chat-header">
            Chat con Banco de Sabadell
            <span className="close-btn" onClick={() => setIsOpen(false)}>✕</span>
          </div>
          <div className="chat-body">
            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={msg.sender === 'user' ? 'user-message' : 'assistant-message'}
                >
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
              ))}
              {isLoading && <div className="loading-message">Cargando...</div>}
            </div>
          </div>
          <div className="input-container">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown} // Detectar tecla "Enter"
              placeholder="Escribe tu mensaje..."
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [userId] = useState(getOrCreateUserId());

  return (
    <div className="App">
      <ChatPopup userId={userId} />
    </div>
  );
}

export default App;
