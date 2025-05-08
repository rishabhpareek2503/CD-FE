"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
// Initialize Firebase (use your own config)
var firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
// User ID to associate data with
var userId = "YOUR_USER_ID"; // Replace with actual user ID
// Generate random number within range
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
// Generate random date within the last 30 days
function randomDate(days) {
    if (days === void 0) { days = 30; }
    var date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * days));
    return date;
}
// Generate mock companies
function generateCompanies() {
    return __awaiter(this, void 0, void 0, function () {
        var companyId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    companyId = "company-".concat(userId);
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "companies", companyId), {
                            name: "Hitesh Enviro Engineers",
                            type: "Wastewater Treatment",
                            numberOfIndustries: 5,
                            userId: userId,
                            location: "Mumbai, India",
                            createdAt: firestore_1.Timestamp.fromDate(new Date()),
                            updatedAt: firestore_1.Timestamp.fromDate(new Date()),
                        })];
                case 1:
                    _a.sent();
                    console.log("Company created:", companyId);
                    return [2 /*return*/, companyId];
            }
        });
    });
}
// Generate mock devices
function generateDevices(companyId) {
    return __awaiter(this, void 0, void 0, function () {
        var devices, _i, devices_1, device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    devices = [
                        {
                            id: "WW-001",
                            name: "Primary Treatment Plant",
                            serialNumber: "SN-001-2023",
                            location: "North Plant",
                            status: "online",
                        },
                        {
                            id: "WW-002",
                            name: "Secondary Treatment Plant",
                            serialNumber: "SN-002-2023",
                            location: "South Plant",
                            status: "online",
                        },
                        {
                            id: "WW-003",
                            name: "Tertiary Treatment Plant",
                            serialNumber: "SN-003-2023",
                            location: "East Plant",
                            status: "offline",
                        },
                        {
                            id: "WW-004",
                            name: "Sludge Processing Unit",
                            serialNumber: "SN-004-2023",
                            location: "West Plant",
                            status: "maintenance",
                        },
                    ];
                    _i = 0, devices_1 = devices;
                    _a.label = 1;
                case 1:
                    if (!(_i < devices_1.length)) return [3 /*break*/, 4];
                    device = devices_1[_i];
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "devices", device.id), __assign(__assign({}, device), { userId: userId, companyId: companyId, installationDate: firestore_1.Timestamp.fromDate(randomDate(365)), lastMaintenance: firestore_1.Timestamp.fromDate(randomDate(90)), createdAt: firestore_1.Timestamp.fromDate(new Date()), updatedAt: firestore_1.Timestamp.fromDate(new Date()) }))];
                case 2:
                    _a.sent();
                    console.log("Device created:", device.id);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, devices.map(function (d) { return d.id; })];
            }
        });
    });
}
// Generate mock sensor readings
function generateSensorReadings(deviceIds) {
    return __awaiter(this, void 0, void 0, function () {
        var readingsCollection, _i, deviceIds_1, deviceId, currentReading, i, date, reading;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    readingsCollection = (0, firestore_1.collection)(db, "sensorReadings");
                    _i = 0, deviceIds_1 = deviceIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < deviceIds_1.length)) return [3 /*break*/, 8];
                    deviceId = deviceIds_1[_i];
                    currentReading = {
                        deviceId: deviceId,
                        timestamp: firestore_1.Timestamp.fromDate(new Date()),
                        pH: randomInRange(6.0, 9.0),
                        BOD: randomInRange(5, 40),
                        COD: randomInRange(50, 300),
                        TSS: randomInRange(5, 40),
                        flow: randomInRange(20, 120),
                        temperature: randomInRange(10, 40),
                        DO: randomInRange(3, 9),
                        conductivity: randomInRange(400, 1600),
                        turbidity: randomInRange(0.5, 10),
                    };
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(readingsCollection), currentReading)];
                case 2:
                    _a.sent();
                    console.log("Current reading created for device:", deviceId);
                    i = 1;
                    _a.label = 3;
                case 3:
                    if (!(i <= 24)) return [3 /*break*/, 6];
                    date = new Date();
                    date.setHours(date.getHours() - i);
                    reading = {
                        deviceId: deviceId,
                        timestamp: firestore_1.Timestamp.fromDate(date),
                        pH: randomInRange(6.0, 9.0),
                        BOD: randomInRange(5, 40),
                        COD: randomInRange(50, 300),
                        TSS: randomInRange(5, 40),
                        flow: randomInRange(20, 120),
                        temperature: randomInRange(10, 40),
                        DO: randomInRange(3, 9),
                        conductivity: randomInRange(400, 1600),
                        turbidity: randomInRange(0.5, 10),
                    };
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(readingsCollection), reading)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("Historical readings created for device:", deviceId);
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Generate mock alerts
function generateAlerts(deviceIds) {
    return __awaiter(this, void 0, void 0, function () {
        var alertsCollection, alertTypes, _i, deviceIds_2, deviceId, numAlerts, i, alertType, value, alert_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    alertsCollection = (0, firestore_1.collection)(db, "alerts");
                    alertTypes = [
                        { parameter: "pH", threshold: 9.0, type: "high" },
                        { parameter: "BOD", threshold: 35, type: "high" },
                        { parameter: "TSS", threshold: 5, type: "low" },
                        { parameter: "temperature", threshold: 38, type: "high" },
                        { parameter: "DO", threshold: 3.5, type: "low" },
                    ];
                    _i = 0, deviceIds_2 = deviceIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < deviceIds_2.length)) return [3 /*break*/, 7];
                    deviceId = deviceIds_2[_i];
                    numAlerts = Math.floor(Math.random() * 3) + 1;
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < numAlerts)) return [3 /*break*/, 5];
                    alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
                    value = alertType.type === "high"
                        ? alertType.threshold + randomInRange(0.5, 5)
                        : alertType.threshold - randomInRange(0.5, 2);
                    alert_1 = {
                        deviceId: deviceId,
                        parameter: alertType.parameter,
                        value: value,
                        threshold: alertType.threshold,
                        type: alertType.type,
                        status: "active",
                        timestamp: firestore_1.Timestamp.fromDate(new Date()),
                    };
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(alertsCollection), alert_1)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("".concat(numAlerts, " alerts created for device:"), deviceId);
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Main function to generate all mock data
function generateMockData() {
    return __awaiter(this, void 0, void 0, function () {
        var companyId, deviceIds, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log("Starting mock data generation...");
                    return [4 /*yield*/, generateCompanies()
                        // Generate devices
                    ];
                case 1:
                    companyId = _a.sent();
                    return [4 /*yield*/, generateDevices(companyId)
                        // Generate sensor readings
                    ];
                case 2:
                    deviceIds = _a.sent();
                    // Generate sensor readings
                    return [4 /*yield*/, generateSensorReadings(deviceIds)
                        // Generate alerts
                    ];
                case 3:
                    // Generate sensor readings
                    _a.sent();
                    // Generate alerts
                    return [4 /*yield*/, generateAlerts(deviceIds)];
                case 4:
                    // Generate alerts
                    _a.sent();
                    console.log("Mock data generation completed successfully!");
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error("Error generating mock data:", error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Run the generator
generateMockData();
