import React, { useState, useEffect } from 'react';
import '../../styles/messagesstyle.css';

import { 
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, 
  orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';

function MessagesManager({ messages: initialMessages }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, archived
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Fetch conversations for this host
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('hostId', '==', user.uid),
        orderBy('lastUpdated', 'desc')
      );

      const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
        const conversationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setConversations(conversationsData);

        // If a conversation is selected, update its messages
        if (selectedConversation) {
          const updatedConversation = conversationsData.find(c => c.id === selectedConversation.id);
          if (updatedConversation) {
            setSelectedConversation(updatedConversation);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [selectedConversation]);

  // Filter conversations based on filter and search
  const filteredConversations = conversations.filter(conversation => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? conversation.unreadCount > 0 :
      filter === 'archived' ? conversation.isArchived : true;
    
    const matchesSearch = 
      conversation.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Mark conversation as read
  const markAsRead = async (conversationId) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        unreadCount: 0,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const user = auth.currentUser;
      
      // Add message to messages subcollection
      await addDoc(collection(db, 'conversations', selectedConversation.id, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName,
        senderType: 'host',
        timestamp: serverTimestamp(),
        isRead: false
      });

      // Update conversation last message and timestamp
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage,
        lastUpdated: serverTimestamp(),
        unreadCount: (selectedConversation.unreadCount || 0) + 1 // Guest has unread message
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  // Archive conversation
  const archiveConversation = async (conversationId) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        isArchived: true,
        lastUpdated: serverTimestamp()
      });
      alert('Conversation archived successfully!');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Error archiving conversation.');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="messages-manager">
      <div className="messages-header">
        <h2>Messages</h2>
        <p>Communicate with your guests</p>
      </div>

      <div className="messages-content">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          {/* Search and Filter */}
          <div className="messages-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-tabs">
              {['all', 'unread', 'archived'].map(filterType => (
                <button
                  key={filterType}
                  className={`filter-tab ${filter === filterType ? 'active' : ''}`}
                  onClick={() => setFilter(filterType)}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="empty-conversations">
                <div className="empty-icon">💬</div>
                <p>No conversations found</p>
                <small>
                  {filter === 'unread' 
                    ? "You don't have any unread messages"
                    : "Your guest messages will appear here"
                  }
                </small>
              </div>
            ) : (
              filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    selectedConversation?.id === conversation.id ? 'active' : ''
                  } ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    if (conversation.unreadCount > 0) {
                      markAsRead(conversation.id);
                    }
                  }}
                >
                  <div className="conversation-avatar">
                    {conversation.guestName?.charAt(0) || 'G'}
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4 className="guest-name">{conversation.guestName}</h4>
                      <span className="conversation-time">
                        {formatTimestamp(conversation.lastUpdated)}
                      </span>
                    </div>
                    
                    <div className="conversation-preview">
                      <p className="last-message">{conversation.lastMessage}</p>
                      <span className="property-title">{conversation.propertyTitle}</span>
                    </div>
                  </div>

                  <div className="conversation-meta">
                    {conversation.unreadCount > 0 && (
                      <span className="unread-badge">{conversation.unreadCount}</span>
                    )}
                    {conversation.isArchived && (
                      <span className="archive-icon">📁</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="message-thread">
          {selectedConversation ? (
            <>
              <div className="thread-header">
                <div className="thread-info">
                  <h3>{selectedConversation.guestName}</h3>
                  <p>{selectedConversation.propertyTitle}</p>
                </div>
                <div className="thread-actions">
                  <button 
                    className="action-btn archive-btn"
                    onClick={() => archiveConversation(selectedConversation.id)}
                  >
                    📁 Archive
                  </button>
                  <button className="action-btn call-btn">
                    📞 Call
                  </button>
                </div>
              </div>

              <div className="messages-container">
                {selectedConversation.messages?.length > 0 ? (
                  selectedConversation.messages
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((message, index) => (
                      <div
                        key={index}
                        className={`message-bubble ${
                          message.senderType === 'host' ? 'sent' : 'received'
                        }`}
                      >
                        <div className="message-content">
                          <p>{message.text}</p>
                          <span className="message-time">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <div className="message-sender">
                          {message.senderType === 'host' ? 'You' : selectedConversation.guestName}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="message-input-area">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows="3"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button 
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send 📤
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-state">
                <div className="empty-icon">💭</div>
                <h3>Select a Conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response Rate Stats */}
      <div className="messages-stats">
        <div className="stat-card">
          <div className="stat-value">{conversations.length}</div>
          <div className="stat-label">Total Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {conversations.filter(c => c.unreadCount > 0).length}
          </div>
          <div className="stat-label">Unread Messages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">95%</div>
          <div className="stat-label">Response Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">1.2h</div>
          <div className="stat-label">Avg. Response Time</div>
        </div>
      </div>
    </div>
  );
}

export default MessagesManager;