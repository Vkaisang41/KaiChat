import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewChatScreen.css';

const NewChatScreen = () => {
  const [contactsPermission, setContactsPermission] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const navigate = useNavigate();

  // Sample contacts for demo
  const sampleContacts = [
    { id: 1, name: 'Samantha', phone: '+1234567890' },
    { id: 2, name: 'Nicole', phone: '+1234567891' },
    { id: 3, name: 'Emma', phone: '+1234567892' },
    { id: 4, name: 'Alex', phone: '+1234567893' },
  ];

  const requestContactsPermission = () => {
    const granted = window.confirm('Allow KaiChat to access your contacts? This will help you chat with your friends.');
    if (granted) {
      localStorage.setItem('contactsPermission', 'granted');
      setContactsPermission(true);
    }
  };

  const addContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      alert('Please enter both name and phone number');
      return;
    }
    alert(`Contact "${newContactName}" added successfully!`);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const startChat = (contact) => {
    navigate('/', { state: { selectedContact: contact } });
  };

  const filteredContacts = sampleContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  if (!contactsPermission) {
    return (
      <div className="new-chat-container">
        <div className="permission-screen">
          <div className="permission-icon">📞</div>
          <h2>Access Your Contacts</h2>
          <p>Allow KaiChat to access your contacts so you can chat with your friends.</p>
          <button className="permission-btn" onClick={requestContactsPermission}>
            Allow Contact Access
          </button>
          <p className="permission-note">
            You can change this later in Settings {'>'} Privacy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-chat-container">
      <div className="new-chat-header">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1>New Chat</h1>
        <button className="add-btn" onClick={() => setShowAddContact(true)}>+</button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="contacts-list">
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <p>No contacts found</p>
            <p>Add contacts to start chatting</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-item"
              onClick={() => startChat(contact)}
            >
              <div className="contact-avatar">
                <span>{contact.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="contact-info">
                <div className="contact-name">{contact.name}</div>
                <div className="contact-phone">{contact.phone}</div>
              </div>
              <div className="chat-btn">💬</div>
            </div>
          ))
        )}
      </div>

      {showAddContact && (
        <div className="modal-overlay" onClick={() => setShowAddContact(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Contact</h3>
            <input
              type="text"
              placeholder="Contact name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="modal-input"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              className="modal-input"
            />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowAddContact(false)}>
                Cancel
              </button>
              <button className="add-contact-btn" onClick={addContact}>
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewChatScreen;