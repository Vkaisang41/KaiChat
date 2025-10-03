// Utility functions for generating and managing verification codes

// Forbidden codes that should never be generated
const FORBIDDEN_CODES = new Set([
  '123456', '654321', '111111', '222222', '333333', '444444', '555555',
  '666666', '777777', '888888', '999999', '000000', '012345', '543210',
  '101010', '121212', '131313', '141414', '151515', '161616', '171717',
  '181818', '191919', '202020', '212121', '232323', '242424', '252525',
  '262626', '272727', '282828', '292929', '303030', '313131', '323232',
  '343434', '353535', '363636', '373737', '383838', '393939', '404040',
  '414141', '424242', '434343', '454545', '464646', '474747', '484848',
  '494949', '505050', '515151', '525252', '535353', '545454', '565656',
  '575757', '585858', '595959', '606060', '616161', '626262', '636363',
  '646464', '656565', '676767', '686868', '696969', '707070', '717171',
  '727272', '737373', '747474', '757575', '767676', '787878', '797979',
  '808080', '818181', '828282', '838383', '848484', '858585', '868686',
  '878787', '898989', '909090', '919191', '929292', '939393', '949494',
  '959595', '969696', '979797', '989898'
]);

// Import crypto at the top level
import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit verification code
 * @returns {string} 6-digit verification code
 */
export const generateVerificationCode = () => {
  let code;
  let attempts = 0;
  const maxAttempts = 50;
  
  do {
    // Generate random bytes and convert to number
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    
    // Convert to 6-digit code
    code = (randomNumber % 900000 + 100000).toString();
    attempts++;
    
    if (attempts > maxAttempts) {
      // Fallback to timestamp-based generation if crypto fails
      const timestamp = Date.now().toString();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      code = (timestamp.slice(-3) + randomSuffix).slice(0, 6);
      break;
    }
  } while (FORBIDDEN_CODES.has(code));
  
  return code;
};

/**
 * Generate a unique verification code that's not in the used codes set
 * @param {Set} usedCodes - Set of already used codes
 * @param {string} phoneNumber - Phone number to ensure user-specific uniqueness
 * @returns {string} Unique 6-digit verification code
 */
export const generateUniqueVerificationCode = (usedCodes = new Set(), phoneNumber = '') => {
  let code;
  let attempts = 0;
  const maxAttempts = 200; // Increased attempts for better uniqueness
  
  do {
    code = generateVerificationCode();
    attempts++;
    
    // Create a unique key combining phone number and code for user-specific tracking
    const userCodeKey = `${phoneNumber}:${code}`;
    
    if (attempts > maxAttempts) {
      // If we can't find a unique code, use timestamp + crypto random
      const timestamp = Date.now().toString();
      const randomBytes = crypto.randomBytes(2);
      const randomHex = randomBytes.toString('hex');
      const randomNum = parseInt(randomHex, 16) % 1000;
      code = (timestamp.slice(-3) + randomNum.toString().padStart(3, '0')).slice(0, 6);
      break;
    }
  } while (usedCodes.has(code) || FORBIDDEN_CODES.has(code) || userSpecificUsedCodes.has(`${phoneNumber}:${code}`));
  
  usedCodes.add(code);
  // Track user-specific codes to prevent same user getting same code twice
  userSpecificUsedCodes.add(`${phoneNumber}:${code}`);
  
  return code;
};

/**
 * Validate verification code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export const isValidVerificationCode = (code) => {
  return /^\d{6}$/.test(code);
};

/**
 * Check if verification code has expired
 * @param {Date} createdAt - When the code was created
 * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {boolean} True if expired
 */
export const isCodeExpired = (createdAt, expiryMinutes = 10) => {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + (expiryMinutes * 60 * 1000));
  return now > expiryTime;
};

// In-memory store for active verification codes
// In production, you might want to use Redis or database
const activeVerificationCodes = new Map();
const usedCodes = new Set();
const userSpecificUsedCodes = new Set(); // Track codes per user to prevent reuse

// Cleanup old user-specific codes periodically (keep last 100 codes per user)
const MAX_USER_CODES_HISTORY = 100;
const userCodeHistory = new Map(); // phoneNumber -> Array of codes

/**
 * Store verification code for a phone number
 * @param {string} phone - Phone number
 * @param {string} code - Verification code
 */
export const storeVerificationCode = (phone, code = null) => {
  const verificationCode = code || generateUniqueVerificationCode(usedCodes, phone);
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Track user's code history
  if (!userCodeHistory.has(phone)) {
    userCodeHistory.set(phone, []);
  }
  
  const userCodes = userCodeHistory.get(phone);
  userCodes.push(verificationCode);
  
  // Keep only the last MAX_USER_CODES_HISTORY codes
  if (userCodes.length > MAX_USER_CODES_HISTORY) {
    const removedCode = userCodes.shift();
    userSpecificUsedCodes.delete(`${phone}:${removedCode}`);
  }
  
  activeVerificationCodes.set(phone, {
    code: verificationCode,
    createdAt: new Date(),
    expiresAt: expiryTime,
    attempts: 0
  });
  
  return verificationCode;
};

/**
 * Verify code for a phone number
 * @param {string} phone - Phone number
 * @param {string} code - Code to verify
 * @returns {object} Verification result
 */
export const verifyCode = (phone, code) => {
  const storedData = activeVerificationCodes.get(phone);
  
  if (!storedData) {
    return { success: false, error: 'No verification code found for this phone number' };
  }
  
  if (isCodeExpired(storedData.createdAt)) {
    activeVerificationCodes.delete(phone);
    return { success: false, error: 'Verification code has expired' };
  }
  
  storedData.attempts++;
  
  if (storedData.attempts > 3) {
    activeVerificationCodes.delete(phone);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }
  
  if (storedData.code === code) {
    activeVerificationCodes.delete(phone);
    usedCodes.delete(code); // Allow code to be reused after successful verification
    return { success: true };
  }
  
  return { success: false, error: 'Invalid verification code' };
};

/**
 * Get verification code for a phone number (for testing/emulator)
 * @param {string} phone - Phone number
 * @returns {string|null} Verification code or null if not found
 */
export const getVerificationCode = (phone) => {
  const storedData = activeVerificationCodes.get(phone);
  return storedData ? storedData.code : null;
};

/**
 * Clear expired codes (cleanup function)
 */
export const clearExpiredCodes = () => {
  const now = new Date();
  for (const [phone, data] of activeVerificationCodes.entries()) {
    if (now > data.expiresAt) {
      activeVerificationCodes.delete(phone);
      usedCodes.delete(data.code);
      // Don't remove from userSpecificUsedCodes to prevent reuse
    }
  }
  
  // Periodic cleanup of global used codes (keep last 10000 codes)
  if (usedCodes.size > 10000) {
    const codesArray = Array.from(usedCodes);
    const keepCodes = codesArray.slice(-5000); // Keep last 5000
    usedCodes.clear();
    keepCodes.forEach(code => usedCodes.add(code));
  }
};

/**
 * Get statistics about code generation (for monitoring)
 */
export const getCodeStats = () => {
  return {
    activeVerifications: activeVerificationCodes.size,
    totalUsedCodes: usedCodes.size,
    userSpecificCodes: userSpecificUsedCodes.size,
    usersWithHistory: userCodeHistory.size
  };
};

// Run cleanup every 5 minutes
setInterval(clearExpiredCodes, 5 * 60 * 1000);