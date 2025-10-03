import asyncHandler from "express-async-handler";
import Contact from "../models/Contact.js";
import User from "../models/User.js";

// Get all contacts for the authenticated user
export const getContacts = asyncHandler(async (req, res) => {
  const {
    search,
    favorites = false,
    registered = false,
    limit = 50,
    offset = 0,
    sortBy = 'name'
  } = req.query;

  let query = { owner: req.user.id, isBlocked: false };

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { nickname: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by favorites
  if (favorites === 'true') {
    query.isFavorite = true;
  }

  // Filter by registered users only
  if (registered === 'true') {
    query.isRegistered = true;
  }

  // Sort options
  let sortOptions = {};
  switch (sortBy) {
    case 'name':
      sortOptions = { name: 1 };
      break;
    case 'recent':
      sortOptions = { lastMessageTime: -1, updatedAt: -1 };
      break;
    case 'favorites':
      sortOptions = { isFavorite: -1, name: 1 };
      break;
    default:
      sortOptions = { name: 1 };
  }

  const contacts = await Contact.find(query)
    .populate('registeredUser', 'fullName username profilePicture status isOnline lastSeen presence')
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  // Get total count for pagination
  const total = await Contact.countDocuments(query);

  res.json({
    contacts,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + contacts.length) < total
    }
  });
});

// Get a specific contact
export const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id
  }).populate('registeredUser', 'fullName username profilePicture status isOnline lastSeen presence');

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  res.json(contact);
});

// Create a new contact
export const createContact = asyncHandler(async (req, res) => {
  const { name, phone, email, avatar, nickname, company, notes, tags } = req.body;

  // Check if contact already exists for this user
  const existingContact = await Contact.findOne({
    owner: req.user.id,
    phone: phone
  });

  if (existingContact) {
    res.status(400);
    throw new Error("Contact with this phone number already exists");
  }

  // Create the contact
  const contact = await Contact.create({
    owner: req.user.id,
    name,
    phone,
    email,
    avatar: avatar || "👤",
    nickname,
    company,
    notes,
    tags: tags || [],
    source: 'manual'
  });

  // Check if this phone number belongs to a registered user
  await contact.checkRegistration();

  const populatedContact = await Contact.findById(contact._id)
    .populate('registeredUser', 'fullName username profilePicture status isOnline lastSeen presence');

  res.status(201).json(populatedContact);
});

// Update a contact
export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  const { name, phone, email, avatar, nickname, company, notes, tags, isFavorite } = req.body;

  // If phone number is being changed, check for duplicates
  if (phone && phone !== contact.phone) {
    const existingContact = await Contact.findOne({
      owner: req.user.id,
      phone: phone,
      _id: { $ne: contact._id }
    });

    if (existingContact) {
      res.status(400);
      throw new Error("Contact with this phone number already exists");
    }
  }

  // Update fields
  contact.name = name || contact.name;
  contact.phone = phone || contact.phone;
  contact.email = email !== undefined ? email : contact.email;
  contact.avatar = avatar || contact.avatar;
  contact.nickname = nickname !== undefined ? nickname : contact.nickname;
  contact.company = company !== undefined ? company : contact.company;
  contact.notes = notes !== undefined ? notes : contact.notes;
  contact.tags = tags !== undefined ? tags : contact.tags;
  contact.isFavorite = isFavorite !== undefined ? isFavorite : contact.isFavorite;

  // If phone changed, recheck registration
  if (phone && phone !== contact.phone) {
    contact.isRegistered = false;
    contact.registeredUser = null;
    await contact.save();
    await contact.checkRegistration();
  } else {
    await contact.save();
  }

  const updatedContact = await Contact.findById(contact._id)
    .populate('registeredUser', 'fullName username profilePicture status isOnline lastSeen presence');

  res.json(updatedContact);
});

// Delete a contact
export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  await Contact.findByIdAndDelete(contact._id);
  res.json({ message: "Contact deleted successfully" });
});

// Block/Unblock a contact
export const toggleBlockContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  contact.isBlocked = !contact.isBlocked;
  await contact.save();

  res.json({
    message: `Contact ${contact.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    contact
  });
});

// Import contacts from phone/external source
export const importContacts = asyncHandler(async (req, res) => {
  const { contacts } = req.body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    res.status(400);
    throw new Error("Please provide an array of contacts to import");
  }

  const importResults = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const contactData of contacts) {
    try {
      const { name, phone, email, phoneContactId } = contactData;

      if (!name || !phone) {
        importResults.errors.push(`Contact missing required fields: ${JSON.stringify(contactData)}`);
        continue;
      }

      // Check if contact already exists
      const existingContact = await Contact.findOne({
        owner: req.user.id,
        phone: phone
      });

      if (existingContact) {
        // Update existing contact if it's from sync and has newer data
        if (existingContact.source === 'synced' || existingContact.source === 'auto') {
          existingContact.name = name;
          existingContact.email = email || existingContact.email;
          existingContact.phoneContactId = phoneContactId || existingContact.phoneContactId;
          existingContact.lastSyncedAt = new Date();
          await existingContact.save();
          await existingContact.checkRegistration();
          importResults.updated++;
        } else {
          importResults.skipped++;
        }
      } else {
        // Create new contact
        const newContact = await Contact.create({
          owner: req.user.id,
          name,
          phone,
          email,
          phoneContactId,
          source: 'imported',
          lastSyncedAt: new Date()
        });

        await newContact.checkRegistration();
        importResults.imported++;
      }
    } catch (error) {
      importResults.errors.push(`Error processing contact ${contactData.name}: ${error.message}`);
    }
  }

  res.json({
    message: "Contact import completed",
    results: importResults
  });
});

// Sync contacts with registered users
export const syncContactsWithUsers = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({
    owner: req.user.id,
    isRegistered: false
  });

  let syncedCount = 0;

  for (const contact of contacts) {
    const user = await contact.checkRegistration();
    if (user) {
      syncedCount++;
    }
  }

  res.json({
    message: `Synced ${syncedCount} contacts with registered users`,
    syncedCount
  });
});

// Get contact suggestions (registered users not in contacts)
export const getContactSuggestions = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get all phone numbers from user's contacts
  const userContacts = await Contact.find({ owner: req.user.id }).select('phone');
  const contactPhones = userContacts.map(contact => contact.phone);

  // Find registered users not in contacts
  const suggestions = await User.find({
    _id: { $ne: req.user.id },
    phone: { $nin: contactPhones },
    phone: { $exists: true, $ne: null }
  })
  .select('fullName username phone profilePicture status isOnline')
  .limit(parseInt(limit));

  res.json(suggestions);
});