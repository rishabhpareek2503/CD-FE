// A simple script to view devices in the Firebase database
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

// Use the same config as your app
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

async function listDevices() {
  console.log("Fetching devices from Firebase...");
  
  try {
    // Get devices
    const devicesSnapshot = await getDocs(collection(db, "devices"));
    console.log(`Found ${devicesSnapshot.size} devices:`);
    
    if (devicesSnapshot.empty) {
      console.log("No devices found in the database.");
    } else {
      devicesSnapshot.forEach((doc) => {
        const device = doc.data();
        console.log(`- Device ID: ${doc.id}`);
        console.log(`  Name: ${device.name}`);
        console.log(`  Status: ${device.status}`);
        console.log(`  Location: ${device.location}`);
        console.log("---");
      });
    }
    
    // Get sensor readings
    const readingsSnapshot = await getDocs(collection(db, "sensorReadings"));
    console.log(`\nFound ${readingsSnapshot.size} sensor readings.`);
    
    if (readingsSnapshot.size > 0) {
      // Group readings by device ID
      const deviceReadings = {};
      
      readingsSnapshot.forEach((doc) => {
        const reading = doc.data();
        const deviceId = reading.deviceId;
        
        if (!deviceReadings[deviceId]) {
          deviceReadings[deviceId] = 0;
        }
        
        deviceReadings[deviceId]++;
      });
      
      console.log("\nReadings per device:");
      Object.entries(deviceReadings).forEach(([deviceId, count]) => {
        console.log(`- Device ${deviceId}: ${count} readings`);
      });
    }
    
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

listDevices()
  .then(() => console.log("\nDone listing devices and readings."))
  .catch(console.error);
