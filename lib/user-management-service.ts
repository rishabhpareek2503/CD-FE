import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"

export interface UserProfile {
  id: string
  email: string
  name?: string
  company?: string
  role: "user" | "admin" | "developer"
  onboardingComplete: boolean
  permissions: string[]
  createdAt: Date
  lastLogin?: Date
  notificationPreferences?: {
    pushEnabled: boolean
    emailEnabled: boolean
    smsEnabled: boolean
    whatsappEnabled: boolean
  }
}

export class UserManagementService {
  // Get all users
  public static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const snapshot = await getDocs(usersRef)

      const users: UserProfile[] = []

      snapshot.forEach((doc) => {
        const userData = doc.data()

        users.push({
          id: doc.id,
          email: userData.email || "",
          name: userData.name,
          company: userData.company,
          role: userData.role || "user",
          onboardingComplete: userData.onboardingComplete || false,
          permissions: userData.permissions || [],
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined,
          notificationPreferences: userData.notificationPreferences,
        })
      })

      return users
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error
    }
  }

  // Get user by ID
  public static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        return null
      }

      const userData = userDoc.data()

      return {
        id: userDoc.id,
        email: userData.email || "",
        name: userData.name,
        company: userData.company,
        role: userData.role || "user",
        onboardingComplete: userData.onboardingComplete || false,
        permissions: userData.permissions || [],
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined,
        notificationPreferences: userData.notificationPreferences,
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      throw error
    }
  }

  // Create a new user
  public static async createUser(
    email: string,
    password: string,
    userData: Partial<UserProfile>,
  ): Promise<UserProfile> {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create the user profile in Firestore
      const userProfile: Partial<UserProfile> = {
        email,
        name: userData.name,
        company: userData.company,
        role: userData.role || "user",
        onboardingComplete: userData.onboardingComplete || false,
        permissions: userData.permissions || ["view:basic"],
        createdAt: new Date(),
      }

      await setDoc(doc(db, "users", user.uid), userProfile)

      return {
        id: user.uid,
        ...userProfile,
      } as UserProfile
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  // Update user profile
  public static async updateUser(userId: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)

      // Remove id from userData to avoid overwriting it
      const { id, ...dataToUpdate } = userData

      await updateDoc(userRef, dataToUpdate)
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  // Delete a user
  public static async deleteUser(userId: string): Promise<void> {
    try {
      // Delete user from Firestore
      await deleteDoc(doc(db, "users", userId))

      // In a real application, you would also delete the user from Firebase Auth
      // This requires admin SDK access or a Cloud Function
      // For now, we'll just delete from Firestore
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  // Update user role
  public static async updateUserRole(userId: string, role: "user" | "admin" | "developer"): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)

      await updateDoc(userRef, { role })
    } catch (error) {
      console.error("Error updating user role:", error)
      throw error
    }
  }

  // Update user permissions
  public static async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)

      await updateDoc(userRef, { permissions })
    } catch (error) {
      console.error("Error updating user permissions:", error)
      throw error
    }
  }
}
