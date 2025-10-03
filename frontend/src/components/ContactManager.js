import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ContactManager.css';

const ContactManager = ({ isOpen, onClose, onContactAdded, editingContact = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: '👤',
    nickname: '',
    company: '',
    notes: '',
    tags: [],
    isFavorite: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Avatar options
  const avatarOptions = [
    '👤', '👨', '👩', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', 
    '👨‍🎨', '👩‍🎨', '👨‍🔬', '👩‍🔬', '👨‍🏫', '👩‍🏫',
    '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🎤', '👩‍🎤'
  ];

  useEffect(() => {
    if (editingContact) {
      setFormData({
        name: editingContact.name || '',
        phone: editingContact.phone || '',
        email: editingContact.email || '',
        avatar: editingContact.avatar || '👤',
        nickname: editingContact.nickname || '',
        company: editingContact.company || '',
        notes: editingContact.notes || '',
        tags: editingContact.tags || [],
        isFavorite: editingContact.isFavorite || false
      });
    } else {
      // Reset form for new contact
      setFormData({
        name: '',
        phone: '',
        email: '',
        avatar: '👤',
        nickname: '',
        company: '',
        notes: '',
        tags: [],
        isFavorite: false
      });
    }
    setError('');
  }, [editingContact, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({ ...prev, avatar }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Name and phone number are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      let response;
      if (editingContact) {
        // Update existing contact
        response = await axios.put(
          `http://localhost:5000/api/contacts/${editingContact.id}`,
          formData,
          config
        );
      } else {
        // Create new contact
        response = await axios.post(
          'http://localhost:5000/api/contacts',
          formData,
          config
        );
      }

      onContactAdded(response.data);
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      setError(error.response?.data?.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleImportContacts = async () => {
    if (!navigator.contacts) {
      setError('Contact access not supported on this device');
      return;
    }

    try {
      setLoading(true);
      const contacts = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: true });
      
      const contactsToImport = contacts.map(contact => ({
        name: contact.name?.[0] || 'Unknown',
        phone: contact.tel?.[0] || '',
        email: contact.email?.[0] || '',
        phoneContactId: contact.id
      })).filter(contact => contact.phone); // Only import contacts with phone numbers

      if (contactsToImport.length === 0) {
        setError('No contacts with phone numbers found');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/contacts/import',
        { contacts: contactsToImport },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Import completed: ${response.data.results.imported} imported, ${response.data.results.updated} updated, ${response.data.results.skipped} skipped`);
      onContactAdded(); // Refresh contacts list
      onClose();
    } catch (error) {
      console.error('Error importing contacts:', error);
      setError('Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content contact-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="contact-form">
          {/* Avatar Selection */}
          <div className="form-group">
            <label>Avatar</label>
            <div className="avatar-selection">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  className={`avatar-option ${formData.avatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter contact name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>
            <div className="form-group">
              <label>Nickname</label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="Enter nickname"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Enter company name"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button type="button" onClick={handleAddTag}>Add</button>
            </div>
            <div className="tags-list">
              {formData.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add notes about this contact"
              rows="3"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isFavorite"
                checked={formData.isFavorite}
                onChange={handleInputChange}
              />
              Mark as favorite
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            {!editingContact && (
              <button 
                type="button" 
                className="import-btn" 
                onClick={handleImportContacts}
                disabled={loading}
              >
                Import Contacts
              </button>
            )}
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : (editingContact ? 'Update' : 'Add Contact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactManager;