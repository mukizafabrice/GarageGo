import { Linking, Platform, Alert } from 'react-native';

/**
 * Utility functions for WhatsApp integration
 */

/**
 * Formats a phone number for WhatsApp
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number for WhatsApp
 */
export const formatPhoneForWhatsApp = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // Add country code if not present (assuming default country code)
  // You can modify this based on your app's target region
  if (cleaned.length === 10) {
    // Assuming US/Canada format, add +1
    cleaned = '1' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Already has country code
    cleaned = cleaned;
  } else if (cleaned.length < 10) {
    // Invalid number
    return null;
  }
  
  return cleaned;
};

/**
 * Opens WhatsApp with a specific phone number
 * @param {string} phoneNumber - The phone number to contact
 * @param {string} message - Optional pre-filled message
 */
export const openWhatsApp = (phoneNumber, message = '') => {
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
  
  if (!formattedPhone) {
    Alert.alert(
      'Invalid Phone Number',
      'Please provide a valid phone number to contact via WhatsApp.',
      [{ text: 'OK' }]
    );
    return;
  }

  const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  const webWhatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  // Check if WhatsApp is installed
  Linking.canOpenURL(whatsappUrl)
    .then((supported) => {
      if (supported) {
        // Open WhatsApp app
        return Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        return Linking.openURL(webWhatsappUrl);
      }
    })
    .catch((error) => {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        'WhatsApp Not Available',
        'WhatsApp is not installed on this device. Please install WhatsApp or use the call option instead.',
        [
          { text: 'OK' },
          { 
            text: 'Open Web WhatsApp', 
            onPress: () => Linking.openURL(webWhatsappUrl)
          }
        ]
      );
    });
};

/**
 * Opens WhatsApp with a garage contact
 * @param {object} garage - The garage object with phone and name
 * @param {string} userName - The user's name
 * @param {string} userPhone - The user's phone number
 * @param {string} customMessage - Optional custom message
 */
export const openWhatsAppWithGarage = (garage, userName, userPhone, customMessage = '') => {
  if (!garage?.phone) {
    Alert.alert(
      'No Phone Number',
      'This garage does not have a phone number available for WhatsApp contact.',
      [{ text: 'OK' }]
    );
    return;
  }

  const defaultMessage = customMessage || `Hi! I'm ${userName} (${userPhone}). I need assistance with my vehicle. Could you please help me?`;
  
  openWhatsApp(garage.phone, defaultMessage);
};

/**
 * Opens WhatsApp with driver contact
 * @param {object} driverInfo - The driver information object
 * @param {string} garageName - The garage name
 * @param {string} customMessage - Optional custom message
 */
export const openWhatsAppWithDriver = (driverInfo, garageName, customMessage = '') => {
  if (!driverInfo?.phoneNumber) {
    Alert.alert(
      'No Phone Number',
      'Driver phone number is not available for WhatsApp contact.',
      [{ text: 'OK' }]
    );
    return;
  }

  const defaultMessage = customMessage || `Hi! I'm from ${garageName}. I need to coordinate with you regarding the vehicle pickup/delivery.`;
  
  openWhatsApp(driverInfo.phoneNumber, defaultMessage);
};

/**
 * Checks if WhatsApp is available on the device
 * @returns {Promise<boolean>} - True if WhatsApp is available
 */
export const isWhatsAppAvailable = async () => {
  try {
    const supported = await Linking.canOpenURL('whatsapp://send?phone=1234567890');
    return supported;
  } catch (error) {
    console.error('Error checking WhatsApp availability:', error);
    return false;
  }
};

