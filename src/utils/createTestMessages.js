import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';

/**
 * Create test conversations and messages for testing the messaging system
 * Run this function once to populate test data
 */
export const createTestConversations = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in first!');
      return;
    }

    console.log('Creating test conversations...');

    // Test Conversation 1
    const conv1Ref = await addDoc(collection(db, 'conversations'), {
      hostId: user.uid,
      guestId: 'guest123',
      guestName: 'John Smith',
      guestPhoto: 'https://i.pravatar.cc/150?img=12',
      propertyId: 'property1',
      propertyTitle: 'Cozy Downtown Apartment',
      lastMessage: 'What time is check-in?',
      lastMessageSender: 'guest',
      lastUpdated: serverTimestamp(),
      hostUnreadCount: 1,
      guestUnreadCount: 0,
      isArchived: false
    });

    // Add messages to conversation 1
    await addDoc(collection(db, 'conversations', conv1Ref.id, 'messages'), {
      text: 'Hi! I\'m interested in booking your place for next weekend.',
      senderId: 'guest123',
      senderName: 'John Smith',
      senderType: 'guest',
      timestamp: serverTimestamp(),
      isRead: true
    });

    await addDoc(collection(db, 'conversations', conv1Ref.id, 'messages'), {
      text: 'Hello John! That\'s great. The place is available. Would you like to proceed with the booking?',
      senderId: user.uid,
      senderName: user.displayName || 'Host',
      senderType: 'host',
      timestamp: serverTimestamp(),
      isRead: true
    });

    await addDoc(collection(db, 'conversations', conv1Ref.id, 'messages'), {
      text: 'Yes, please! What time is check-in?',
      senderId: 'guest123',
      senderName: 'John Smith',
      senderType: 'guest',
      timestamp: serverTimestamp(),
      isRead: false
    });

    // Test Conversation 2
    const conv2Ref = await addDoc(collection(db, 'conversations'), {
      hostId: user.uid,
      guestId: 'guest456',
      guestName: 'Sarah Johnson',
      guestPhoto: 'https://i.pravatar.cc/150?img=45',
      propertyId: 'property2',
      propertyTitle: 'Beach House Villa',
      lastMessage: 'Thank you for the great stay!',
      lastMessageSender: 'guest',
      lastUpdated: serverTimestamp(),
      hostUnreadCount: 0,
      guestUnreadCount: 0,
      isArchived: false
    });

    await addDoc(collection(db, 'conversations', conv2Ref.id, 'messages'), {
      text: 'Hi! Is parking available at the property?',
      senderId: 'guest456',
      senderName: 'Sarah Johnson',
      senderType: 'guest',
      timestamp: serverTimestamp(),
      isRead: true
    });

    await addDoc(collection(db, 'conversations', conv2Ref.id, 'messages'), {
      text: 'Yes, we have free parking for 2 cars in the driveway.',
      senderId: user.uid,
      senderName: user.displayName || 'Host',
      senderType: 'host',
      timestamp: serverTimestamp(),
      isRead: true
    });

    await addDoc(collection(db, 'conversations', conv2Ref.id, 'messages'), {
      text: 'Thank you for the great stay!',
      senderId: 'guest456',
      senderName: 'Sarah Johnson',
      senderType: 'guest',
      timestamp: serverTimestamp(),
      isRead: true
    });

    // Test Conversation 3 (Unread)
    const conv3Ref = await addDoc(collection(db, 'conversations'), {
      hostId: user.uid,
      guestId: 'guest789',
      guestName: 'Mike Davis',
      guestPhoto: 'https://i.pravatar.cc/150?img=33',
      propertyId: 'property3',
      propertyTitle: 'Mountain Cabin Retreat',
      lastMessage: 'Can I bring my pet dog?',
      lastMessageSender: 'guest',
      lastUpdated: serverTimestamp(),
      hostUnreadCount: 2,
      guestUnreadCount: 0,
      isArchived: false
    });

    await addDoc(collection(db, 'conversations', conv3Ref.id, 'messages'), {
      text: 'Hello! I\'m planning to visit next month.',
      senderId: 'guest789',
      senderName: 'Mike Davis',
      senderType: 'guest',
      timestamp: serverTimestamp(),
      isRead: false
    });

    await addDoc(collection(db, 'conversations', conv3Ref.id, 'messages'), {
      text: 'Can I bring my pet dog?',
      senderId: 'guest789',
      senderName: 'Mike Davis',
      senderType: 'guest',
      timestamp: serverTimestamp(),
      isRead: false
    });

    // Test Conversation 4 (Archived)
    await addDoc(collection(db, 'conversations'), {
      hostId: user.uid,
      guestId: 'guest101',
      guestName: 'Emily Brown',
      guestPhoto: 'https://i.pravatar.cc/150?img=20',
      propertyId: 'property1',
      propertyTitle: 'Cozy Downtown Apartment',
      lastMessage: 'Thanks for everything!',
      lastMessageSender: 'guest',
      lastUpdated: serverTimestamp(),
      hostUnreadCount: 0,
      guestUnreadCount: 0,
      isArchived: true
    });

    console.log('✅ Test conversations created successfully!');
    alert('✅ Test conversations created! Refresh the page to see them.');
    
  } catch (error) {
    console.error('Error creating test conversations:', error);
    alert('Error creating test data: ' + error.message);
  }
};

/**
 * Clear all test conversations (cleanup function)
 */
export const clearTestConversations = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in first!');
      return;
    }

    // Note: You'll need to manually delete from Firebase Console
    // or implement a Cloud Function for bulk delete
    alert('Please delete test conversations manually from Firebase Console:\n\nFirestore > conversations collection');
    
  } catch (error) {
    console.error('Error:', error);
  }
};
