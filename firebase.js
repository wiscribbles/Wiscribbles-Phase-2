import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


async function getUserData(userId) {  // Changed from userID to userId
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
    
        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User Category:', userData.signUpAs);
            console.log('User Data:', userData);
            return { success: true, data: userData };
        } else {
            console.log('No such user!');
            return { success: false, error: 'User not found' };
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return { success: false, error };
    }
}

const storeUserData = async (userData) => {
  try {
    // Store user data in Firestore
    await setDoc(doc(db, "users", userData.uid), userData);
    return { success: true };
  } catch (error) {
    console.error("Error storing user data:", error);
    return { success: false, error };
  }
};

  export { auth, db, storage, analytics, storeUserData, getUserData };
