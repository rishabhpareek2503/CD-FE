// Script to update a device's user ID in Firebase
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc, getDoc } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAYIEWR-ewTCj-i0U0BquqcCSLJYDDVdY",
  authDomain: "live-monitoring-system.firebaseapp.com",
  databaseURL: "https://live-monitoring-system-default-rtdb.firebaseio.com",
  projectId: "live-monitoring-system",
  storageBucket: "live-monitoring-system.firebasestorage.app",
  messagingSenderId: "396044271748",
  appId: "1:396044271748:web:732d8bbfc8e06b7c8582d1",
  measurementId: "G-3R13EZNEJZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Device ID to update - use one that has data
const deviceIdToUpdate = "WW-001";

// Email and password to use for authentication
// Replace with your actual login credentials
const email = "YOUR_EMAIL@example.com";
const password = "YOUR_PASSWORD";

async function loginAndUpdateDevice() {
  try {
    // Check if the device exists
    const deviceRef = doc(db, "devices", deviceIdToUpdate);
    const deviceSnap = await getDoc(deviceRef);
    
    if (!deviceSnap.exists()) {
      console.log(`Device ${deviceIdToUpdate} not found.`);
      return;
    }
    
    // Try to login to get the current user ID
    console.log(`Attempting to log in as ${email}...`);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Logged in successfully. User ID: ${user.uid}`);
    console.log(`Updating device ${deviceIdToUpdate} to use this user ID...`);
    
    // Update the device with the current user's ID
    await updateDoc(deviceRef, {
      userId: user.uid
    });
    
    console.log(`Device ${deviceIdToUpdate} updated successfully.`);
    console.log(`\nNow this device should appear in your dashboard when you log in.`);
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code === "auth/invalid-credential") {
      console.log("\nPlease edit this script with your actual Firebase login credentials.");
    }
  }
}

// Show instructions
console.log("IMPORTANT: Before running this script, edit it to add your Firebase login email and password.");
console.log("This script will update device WW-001 to associate it with your user account.");
console.log("If you want to update a different device, change the deviceIdToUpdate variable in the script.");
console.log("\nPress Ctrl+C to cancel if you haven't updated the credentials yet.\n");

// Wait 5 seconds before continuing, to give time to cancel
setTimeout(() => {
  loginAndUpdateDevice()
    .then(() => console.log("\nScript completed."))
    .catch(console.error);
}, 5000);
