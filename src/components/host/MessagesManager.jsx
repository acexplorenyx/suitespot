import React, { useState, useEffect, useRef } from 'react';
import '../../styles/messagesstyle.css';

import { 
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, 
  orderBy, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { createTestConversations } from '../../utils/createTestMessages';

function MessagesManager({ messages: initialMessages }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, archived
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Fetch conversations
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch conversations for this host
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('hostId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort in JavaScript instead of Firestore
      .sort((a, b) => {
        const aTime = a.lastUpdated?.toMillis() || 0;
        const bTime = b.lastUpdated?.toMillis() || 0;
        return bTime - aTime;
      });
      
      console.log('Loaded conversations:', conversationsData.length, conversationsData);
      setConversations(conversationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      alert('Error loading conversations: ' + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setConversationMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'conversations', selectedConversation.id, 'messages')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort in JavaScript
      .sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return aTime - bTime;
      });
      
      setConversationMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Filter conversations based on filter and search
  const filteredConversations = conversations.filter(conversation => {
    const matchesFilter = 
      filter === 'all' ? !conversation.isArchived :
      filter === 'unread' ? (conversation.hostUnreadCount > 0 || conversation.unreadCount > 0) && !conversation.isArchived :
      filter === 'archived' ? conversation.isArchived : true;
    
    const matchesSearch = 
      conversation.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });
  
  console.log('Filter:', filter, 'Total conversations:', conversations.length, 'Filtered:', filteredConversations.length);

  // Mark conversation as read
  const markAsRead = async (conversationId) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        hostUnreadCount: 0,
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
        senderName: user.displayName || 'Host',
        senderType: 'host',
        timestamp: serverTimestamp(),
        isRead: false
      });

      // Update conversation last message and timestamp
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage,
        lastMessageSender: 'host',
        lastUpdated: serverTimestamp(),
        guestUnreadCount: (selectedConversation.guestUnreadCount || 0) + 1 // Guest has unread message
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
      setSelectedConversation(null);
      alert('Conversation archived successfully!');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Error archiving conversation.');
    }
  };

  // Unarchive conversation
  const unarchiveConversation = async (conversationId) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        isArchived: false,
        lastUpdated: serverTimestamp()
      });
      alert('Conversation unarchived successfully!');
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate unread count
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.hostUnreadCount || 0), 0);

  if (loading) {
    return (
      <div className="messages-manager">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-manager">
      <div className="messages-header">
        <div>
          <h2>Messages</h2>
          <p>Communicate with your guests</p>
        </div>
        {conversations.length === 0 && !loading && (
          <button 
            className="create-test-btn"
            onClick={createTestConversations}
          >
            🧪 Create Test Conversations
          </button>
        )}
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
              {[
                { key: 'all', label: 'All', count: conversations.filter(c => !c.isArchived).length },
                { key: 'unread', label: 'Unread', count: totalUnreadCount },
                { key: 'archived', label: 'Archived', count: conversations.filter(c => c.isArchived).length }
              ].map(filterType => (
                <button
                  key={filterType.key}
                  className={`filter-tab ${filter === filterType.key ? 'active' : ''}`}
                  onClick={() => setFilter(filterType.key)}
                >
                  {filterType.label}
                  {filterType.count > 0 && (
                    <span className="filter-count">{filterType.count}</span>
                  )}
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
                    : filter === 'archived'
                    ? "No archived conversations"
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
                  } ${(conversation.hostUnreadCount || 0) > 0 ? 'unread' : ''}`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    if ((conversation.hostUnreadCount || 0) > 0) {
                      markAsRead(conversation.id);
                    }
                  }}
                >
                  <div className="conversation-avatar">
                    <img 
                      src={conversation.guestPhoto || '/api/placeholder/40/40'} 
                      alt={conversation.guestName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="avatar-fallback" style={{ display: 'none' }}>
                      {conversation.guestName?.charAt(0) || 'G'}
                    </div>
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4 className="guest-name">{conversation.guestName || 'Guest'}</h4>
                      <span className="conversation-time">
                        {formatTimestamp(conversation.lastUpdated)}
                      </span>
                    </div>
                    
                    <div className="conversation-preview">
                      <p className="last-message">
                        {conversation.lastMessageSender === 'host' && 'You: '}
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                      <span className="property-title">
                        📍 {conversation.propertyTitle || 'Property'}
                      </span>
                    </div>
                  </div>

                  <div className="conversation-meta">
                    {(conversation.hostUnreadCount || 0) > 0 && (
                      <span className="unread-badge">{conversation.hostUnreadCount}</span>
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
                  <div className="thread-avatar">
                    <img 
                      src={selectedConversation.guestPhoto || '/api/placeholder/48/48'} 
                      alt={selectedConversation.guestName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="avatar-fallback" style={{ display: 'none' }}>
                      {selectedConversation.guestName?.charAt(0) || 'G'}
                    </div>
                  </div>
                  <div>
                    <h3>{selectedConversation.guestName || 'Guest'}</h3>
                    <p>📍 {selectedConversation.propertyTitle || 'Property'}</p>
                  </div>
                </div>
                <div className="thread-actions">
                  {selectedConversation.isArchived ? (
                    <button 
                      className="action-btn unarchive-btn"
                      onClick={() => unarchiveConversation(selectedConversation.id)}
                    >
                      📂 Unarchive
                    </button>
                  ) : (
                    <button 
                      className="action-btn archive-btn"
                      onClick={() => archiveConversation(selectedConversation.id)}
                    >
                      📁 Archive
                    </button>
                  )}
                  <button className="action-btn info-btn" title="View booking details">
                    ℹ️ Info
                  </button>
                </div>
              </div>

              <div className="messages-container">
                {conversationMessages.length > 0 ? (
                  <>
                    {conversationMessages.map((message, index) => {
                      const isHost = message.senderType === 'host';
                      const showDate = index === 0 || 
                        (conversationMessages[index - 1] && 
                         new Date(message.timestamp?.toDate()).toDateString() !== 
                         new Date(conversationMessages[index - 1].timestamp?.toDate()).toDateString());

                      return (
                        <React.Fragment key={message.id}>
                          {showDate && (
                            <div className="message-date-divider">
                              {new Date(message.timestamp?.toDate()).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          )}
                          <div className={`message-bubble ${isHost ? 'sent' : 'received'}`}>
                            {!isHost && (
                              <div className="message-avatar">
                                {selectedConversation.guestName?.charAt(0) || 'G'}
                              </div>
                            )}
                            <div className="message-content">
                              <p>{message.text}</p>
                              <span className="message-time">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="no-messages">
                    <div className="empty-icon">💭</div>
                    <p>No messages yet</p>
                    <small>Start the conversation with your guest!</small>
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
                <div className="input-actions">
                  <button className="emoji-btn" title="Add emoji">😊</button>
                  <button className="attach-btn" title="Attach file">📎</button>
                  <button 
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send 📤
                  </button>
                </div>
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
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <div className="stat-value">{conversations.filter(c => !c.isArchived).length}</div>
            <div className="stat-label">Active Chats</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <div className="stat-value">{totalUnreadCount}</div>
            <div className="stat-label">Unread</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <div className="stat-value">95%</div>
            <div className="stat-label">Response Rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">1.2h</div>
            <div className="stat-label">Avg. Response</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesManager;
