import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import MediaMessage from '../components/MediaMessage';
import VoiceRecorder from '../components/VoiceRecorder';
import ContactManager from '../components/ContactManager';
import LoadingAnimation from '../components/LoadingAnimation';
import TypingIndicator from '../components/TypingIndicator';
import MessageStatus from '../components/MessageStatus';
import { ToastContainer, useToast } from '../components/Toast';
import "./ChatHomeScreen.css";

function ChatHomeScreen() {
  const [user, setUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("global");
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(new Map());
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [showNewChatMenu, setShowNewChatMenu] = useState(false);
  const [showContactManager, setShowContactManager] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // Load contacts from API
  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const token = localStorage.getItem("token");
      const response = await axios.get('http://localhost:5000/api/contacts?sortBy=recent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Transform API contacts to match the expected format
      const transformedContacts = response.data.contacts.map(contact => ({
        id: contact._id,
        name: contact.name,
        avatar: contact.avatar || "👤",
        lastMessage: contact.lastMessage || "No messages yet",
        timestamp: contact.lastMessageTime
          ? formatTimestamp(contact.lastMessageTime)
          : "Never",
        unreadCount: contact.unreadCount || 0,
        isOnline: contact.registeredUser?.isOnline || false,
        statusColor: getStatusColor(contact.registeredUser?.presence || 'offline'),
        phone: contact.phone,
        email: contact.email,
        isRegistered: contact.isRegistered,
        registeredUser: contact.registeredUser
      }));
      
      setContacts(transformedContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
      // Keep empty array if error, don't fall back to sample data
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return messageTime.toLocaleDateString();
  };

  // Helper function to get status color
  const getStatusColor = (presence) => {
    switch (presence) {
      case 'online': return "#4CAF50";
      case 'away': return "#FF9800";
      case 'busy': return "#F44336";
      default: return "#9E9E9E";
    }
  };

  // Sample chat messages for selected contact
  const sampleChatMessages = [
    { id: 1, text: "Hey! How are you?", sender: "them", timestamp: "10:30 AM" },
    { id: 2, text: "I'm good, thanks! How about you?", sender: "me", timestamp: "10:31 AM" },
    { id: 3, text: "Doing great! Working on some new projects.", sender: "them", timestamp: "10:32 AM" },
    { id: 4, text: "That sounds awesome! Tell me more.", sender: "me", timestamp: "10:33 AM" },
    { id: 5, text: "Sure! I'm building a chat app with React.", sender: "them", timestamp: "10:34 AM" }
  ];

  useEffect(() => {
    const userDataString = localStorage.getItem("user");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUser(userData);

        // Initialize socket connection
        const token = localStorage.getItem("token");
        const newSocket = io('http://localhost:5000', {
          auth: {
            token: token
          }
        });

        // Socket event listeners
        newSocket.on('receiveMessage', (message) => {
          // Only add message if it's for the current room
          if (message.room === currentRoom) {
            setChatMessages(prev => [...prev, message]);
            // Mark as read if user is viewing this chat
            if ((selectedContact || selectedGroup) && message.sender !== userData.phone && message.sender !== userData.id) {
              newSocket.emit('messageRead', { messageId: message._id, room: currentRoom });
            }
          }
        });

        newSocket.on('presenceUpdate', ({ userId, presence }) => {
          setOnlineUsers(prev => new Map(prev.set(userId, presence)));
        });

        newSocket.on('typingStarted', ({ userId }) => {
          setTypingUsers(prev => new Set(prev.add(userId)));
        });

        newSocket.on('typingStopped', ({ userId }) => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        });

        newSocket.on('messageReadUpdate', ({ messageId, userId }) => {
          setChatMessages(prev => prev.map(msg =>
            msg._id === messageId
              ? { ...msg, readBy: [...(msg.readBy || []), { user: userId }] }
              : msg
          ));
        });

        setSocket(newSocket);

        // Load messages for global room, groups, and contacts
        loadMessages();
        loadGroups();
        loadContacts();

        // Join user's groups
        const joinUserGroups = async () => {
          try {
            const token = localStorage.getItem("token");
            const groupsResponse = await axios.get('http://localhost:5000/api/groups', {
              headers: { Authorization: `Bearer ${token}` }
            });

            groupsResponse.data.forEach(group => {
              newSocket.emit("joinGroup", { groupId: group._id });
            });
          } catch (error) {
            console.error("Error joining groups:", error);
          }
        };

        joinUserGroups();

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadMessages = async (room = "global") => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/chat/messages/${room}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get('http://localhost:5000/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setSelectedGroup(null);
    setCurrentRoom("global");
    loadMessages("global");
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedContact(null);
    const roomName = `group-${group._id}`;
    setCurrentRoom(roomName);
    loadMessages(roomName);
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && socket && user) {
      socket.emit('sendMessage', {
        message: messageInput,
        user: user,
        replyTo: null, // For now, no replies
        threadId: null,
        room: currentRoom
      });
      setMessageInput("");
      setShowEmojiPicker(false);

      // Stop typing
      socket.emit('stopTyping', { room: currentRoom });
      setIsTyping(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput(prev => prev + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (socket && !isTyping && e.target.value.trim()) {
      socket.emit('startTyping', { room: currentRoom });
      setIsTyping(true);
    } else if (socket && isTyping && !e.target.value.trim()) {
      socket.emit('stopTyping', { room: currentRoom });
      setIsTyping(false);
    }
  };

  const handleInputBlur = () => {
    if (socket && isTyping) {
      socket.emit('stopTyping', { room: currentRoom });
      setIsTyping(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/chat/messages/${messageId}/reactions`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleSearchMessages = async () => {
    if (!searchQuery.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/chat/messages/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
      setShowMessageSearch(true);
    } catch (error) {
      console.error("Error searching messages:", error);
    }
  };


  // Contact management functions
  const handleAddContact = () => {
    setEditingContact(null);
    setShowContactManager(true);
    setShowNewChatMenu(false);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowContactManager(true);
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove contact from local state
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      
      // If this was the selected contact, clear selection
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      
      showSuccess("Contact deleted successfully");
    } catch (error) {
      console.error("Error deleting contact:", error);
      showError("Failed to delete contact");
    }
  };

  const handleToggleFavorite = async (contactId) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      const token = localStorage.getItem("token");
      
      const response = await axios.put(
        `http://localhost:5000/api/contacts/${contactId}`,
        { isFavorite: !contact.isFavorite },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update contact in local state
      setContacts(prev => prev.map(c =>
        c.id === contactId
          ? { ...c, isFavorite: response.data.isFavorite }
          : c
      ));
    } catch (error) {
      console.error("Error updating favorite status:", error);
      showError("Failed to update favorite status");
    }
  };

  const handleContactAdded = (newContact) => {
    if (newContact) {
      // Transform the new contact to match expected format
      const transformedContact = {
        id: newContact._id,
        name: newContact.name,
        avatar: newContact.avatar || "👤",
        lastMessage: newContact.lastMessage || "No messages yet",
        timestamp: newContact.lastMessageTime
          ? formatTimestamp(newContact.lastMessageTime)
          : "Never",
        unreadCount: newContact.unreadCount || 0,
        isOnline: newContact.registeredUser?.isOnline || false,
        statusColor: getStatusColor(newContact.registeredUser?.presence || 'offline'),
        phone: newContact.phone,
        email: newContact.email,
        isRegistered: newContact.isRegistered,
        registeredUser: newContact.registeredUser,
        isFavorite: newContact.isFavorite
      };

      if (editingContact) {
        // Update existing contact
        setContacts(prev => prev.map(contact =>
          contact.id === editingContact.id ? transformedContact : contact
        ));
      } else {
        // Add new contact
        setContacts(prev => [transformedContact, ...prev]);
      }
    } else {
      // Refresh contacts list (for bulk operations like import)
      loadContacts();
    }
  };

  const handleSyncContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post('http://localhost:5000/api/contacts/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showSuccess(`Synced ${response.data.syncedCount} contacts with registered users`);
      loadContacts(); // Refresh the contacts list
    } catch (error) {
      console.error("Error syncing contacts:", error);
      showError("Failed to sync contacts");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post('http://localhost:5000/api/groups', {
        name: groupName,
        description: groupDescription,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(prev => [response.data, ...prev]);
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDescription("");

      // Join the group room
      if (socket) {
        socket.emit("joinGroup", { groupId: response.data._id });
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  // File upload functions
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post('http://localhost:5000/api/files/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingFiles(prev => new Map(prev.set(file.name, percentCompleted)));
        }
      });

      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });
      throw error;
    }
  };

  const getMessageType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'voice';
    return 'document';
  };

  const handleFileSelect = async (files) => {
    for (const file of files) {
      try {
        let fileToUpload = file;

        // Compress images
        if (file.type.startsWith('image/') && file.type !== 'image/gif') {
          const options = {
            maxSizeMB: 1, // Max file size in MB
            maxWidthOrHeight: 1920, // Max width/height
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(file, options);
        }

        const uploadResult = await uploadFile(fileToUpload);
        const messageType = getMessageType(fileToUpload);

        if (socket && user) {
          socket.emit('sendMessage', {
            message: '',
            user: user,
            messageType,
            fileUrl: uploadResult.fileUrl,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    setShowAttachmentMenu(false);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelect(files);
    e.target.value = ''; // Reset input
  };

  const handleVoiceClick = () => {
    setShowVoiceRecorder(true);
    setShowAttachmentMenu(false);
  };

  const handleVoiceRecordingComplete = async (audioFile) => {
    try {
      const uploadResult = await uploadFile(audioFile);

      if (socket && user) {
        socket.emit('sendMessage', {
          message: '',
          user: user,
          messageType: 'voice',
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType
        });
      }
    } catch (error) {
      alert('Failed to upload voice message');
    }
    setShowVoiceRecorder(false);
  };

  const handleVoiceCancel = () => {
    setShowVoiceRecorder(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading KaiChat...</p>
      </div>
    );
  }

  return (
    <div className="chat-home">
      {/* Left Sidebar - Contact List */}
      <div className="contact-sidebar">
        <div className="contact-header">
          <h2 className="chats-title">Chats</h2>
          <div className="new-chat-container">
            <button className="new-chat-btn" onClick={() => setShowNewChatMenu(!showNewChatMenu)}>➕</button>
            {showNewChatMenu && (
              <div className="new-chat-menu">
                <button className="menu-item" onClick={handleAddContact}>
                  <span className="menu-icon">👤</span>
                  <span>Add Contact</span>
                </button>
                <button className="menu-item" onClick={() => navigate('/new-chat')}>
                  <span className="menu-icon">💬</span>
                  <span>New Chat</span>
                </button>
                <button className="menu-item" onClick={() => { setShowCreateGroup(true); setShowNewChatMenu(false); }}>
                  <span className="menu-icon">👥</span>
                  <span>New Group</span>
                </button>
                <button className="menu-item" onClick={handleSyncContacts}>
                  <span className="menu-icon">🔄</span>
                  <span>Sync Contacts</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="contact-list">
          {/* Groups Section */}
          {groups.length > 0 && (
            <>
              <div className="contact-section-header">Groups</div>
              {groups.map((group) => (
                <div
                  key={`group-${group._id}`}
                  className={`contact-item ${selectedGroup?._id === group._id ? 'active' : ''}`}
                  onClick={() => handleGroupClick(group)}
                >
                  <div className="contact-avatar">
                    <span>{group.avatar || '👥'}</span>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{group.name}</div>
                    <div className="contact-last-message">
                      {group.members?.length || 0} members
                    </div>
                  </div>
                  <div className="contact-meta">
                    <div className="contact-timestamp">
                      {new Date(group.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Contacts Section */}
          <div className="contact-section-header">
            Contacts
            {loadingContacts && <span className="loading-text"> (Loading...)</span>}
          </div>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
            >
              <div
                className="contact-main"
                onClick={() => handleContactClick(contact)}
              >
                <div className="contact-avatar">
                  <span>{contact.avatar}</span>
                  <div
                    className="status-indicator"
                    style={{ backgroundColor: contact.statusColor }}
                  ></div>
                  {contact.isFavorite && (
                    <div className="favorite-indicator">⭐</div>
                  )}
                </div>
                <div className="contact-info">
                  <div className="contact-name">
                    {contact.name}
                    {contact.isRegistered && <span className="registered-badge">✓</span>}
                  </div>
                  <div className="contact-last-message">{contact.lastMessage}</div>
                </div>
                <div className="contact-meta">
                  <div className="contact-timestamp">{contact.timestamp}</div>
                  {contact.unreadCount > 0 && (
                    <div className="unread-count">{contact.unreadCount}</div>
                  )}
                </div>
              </div>
              <div className="contact-actions">
                <button
                  className="contact-action-btn"
                  onClick={() => handleToggleFavorite(contact.id)}
                  title={contact.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {contact.isFavorite ? "⭐" : "☆"}
                </button>
                <button
                  className="contact-action-btn"
                  onClick={() => handleEditContact(contact)}
                  title="Edit contact"
                >
                  ✏️
                </button>
                <button
                  className="contact-action-btn delete-btn"
                  onClick={() => handleDeleteContact(contact.id)}
                  title="Delete contact"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Right Side - Chat View */}
      <div className="chat-view">
        {(selectedContact || selectedGroup) ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-contact-avatar">
                <span>{selectedGroup ? (selectedGroup.avatar || '👥') : selectedContact.avatar}</span>
                {selectedContact && (
                  <div
                    className="online-indicator"
                    style={{ backgroundColor: selectedContact.isOnline ? '#4CAF50' : '#ccc' }}
                  ></div>
                )}
              </div>
              <div className="chat-contact-info">
                <div className="chat-contact-name">
                  {selectedGroup ? selectedGroup.name : selectedContact.name}
                </div>
                <div className="chat-contact-status">
                  {selectedGroup
                    ? `${selectedGroup.members?.length || 0} members`
                    : (selectedContact.isOnline ? 'Online' : 'Offline')
                  }
                  {typingUsers.size > 0 && <span className="typing-indicator">Someone is typing...</span>}
                </div>
              </div>
              <button className="search-btn" onClick={() => setShowMessageSearch(!showMessageSearch)}>🔍</button>
            </div>

            {/* Message Search */}
            {showMessageSearch && (
              <div className="message-search">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchMessages()}
                  className="search-input"
                />
                <button onClick={handleSearchMessages}>Search</button>
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((msg) => (
                      <div key={msg._id} className="search-result-item">
                        <strong>{msg.sender}:</strong> {msg.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            <div
              className={`chat-messages ${dragOver ? 'drag-over' : ''}`}
              ref={messagesEndRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {dragOver && (
                <div className="drag-overlay">
                  <div className="drag-indicator">
                    📎 Drop files here to share
                  </div>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div
                  key={msg._id || msg.id}
                  className={`message ${msg.sender === user?.phone || msg.sender === user?.id ? 'outgoing' : 'incoming'}`}
                >
                  {msg.messageType && msg.messageType !== 'text' ? (
                    <MediaMessage
                      message={msg}
                      isOutgoing={msg.sender === user?.phone || msg.sender === user?.id}
                    />
                  ) : (
                    <div className="message-bubble">
                      {msg.content || msg.text}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="message-reactions">
                          {msg.reactions.map((reaction, idx) => (
                            <span key={idx} className="reaction" title={`Reacted by ${reaction.user}`}>
                              {reaction.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="message-actions">
                    <button onClick={() => handleReaction(msg._id || msg.id, '👍')}>👍</button>
                    <button onClick={() => handleReaction(msg._id || msg.id, '❤️')}>❤️</button>
                    <button onClick={() => handleReaction(msg._id || msg.id, '😂')}>😂</button>
                  </div>
                  <div className="message-meta">
                    <div className="message-time">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : msg.timestamp}
                    </div>
                    {msg.readBy && msg.readBy.length > 0 && (
                      <div className="read-receipt">✓✓</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Upload Progress Indicators */}
              {Array.from(uploadingFiles.entries()).map(([fileName, progress]) => (
                <div key={fileName} className="upload-progress">
                  <div className="upload-info">
                    <span>Uploading {fileName}...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="chat-input-bar">
              <button className="emoji-btn" onClick={toggleEmojiPicker}>😄</button>
              <input
                ref={messageInputRef}
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="message-input"
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <button
                className="attachment-btn"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                📎
              </button>
              <button className="voice-btn" onClick={handleVoiceClick}>🎤</button>
              <button className="send-btn" onClick={handleSendMessage}>➡️</button>
            </div>

            {/* Attachment Menu */}
            {showAttachmentMenu && (
              <div className="attachment-menu">
                <button className="attachment-option" onClick={handleAttachmentClick}>
                  <span className="option-icon">🖼️</span>
                  <span>Photos & Videos</span>
                </button>
                <button className="attachment-option" onClick={handleAttachmentClick}>
                  <span className="option-icon">📄</span>
                  <span>Documents</span>
                </button>
                <button className="attachment-option" onClick={handleVoiceClick}>
                  <span className="option-icon">🎵</span>
                  <span>Voice Message</span>
                </button>
              </div>
            )}

            {/* Voice Recorder Modal */}
            {showVoiceRecorder && (
              <div className="modal-overlay" onClick={() => setShowVoiceRecorder(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onCancel={handleVoiceCancel}
                  />
                </div>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="modal-content create-group-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Group</h3>
            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                maxLength="100"
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                maxLength="500"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateGroup(false)}>Cancel</button>
              <button className="create-btn" onClick={handleCreateGroup} disabled={!groupName.trim()}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Manager Modal */}
      <ContactManager
        isOpen={showContactManager}
        onClose={() => {
          setShowContactManager(false);
          setEditingContact(null);
        }}
        onContactAdded={handleContactAdded}
        editingContact={editingContact}
      />
    </div>
  );
}

export default ChatHomeScreen;
