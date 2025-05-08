"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

import { auth, db } from "@/lib/firebase"

interface UserProfile {
  name?: string
  company?: string
  role?: "user" | "admin" | "developer"
  onboardingComplete?: boolean
  permissions?: string[]
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  needsOnboarding: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  setOnboardingComplete: () => Promise<void>
  hasRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile
            setUserProfile(userData)
            setNeedsOnboarding(!userData.onboardingComplete)
          } else {
            // Create a new user profile if it doesn't exist
            const newUserProfile: UserProfile = {
              onboardingComplete: false,
              role: "user", // Default role
              permissions: ["view:basic"], // Default permissions
            }
            await setDoc(userDocRef, newUserProfile)
            setUserProfile(newUserProfile)
            setNeedsOnboarding(true)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      } else {
        setUserProfile(null)
        setNeedsOnboarding(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      console.error("Error signing in:", error)
      let errorMessage = "Failed to sign in"

      // Handle specific Firebase errors
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      }

      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create a new user profile
      const userDocRef = doc(db, "users", user.uid)
      const newUserProfile: UserProfile = {
        onboardingComplete: false,
        role: "user", // Default role
        permissions: ["view:basic"], // Default permissions
      }
      await setDoc(userDocRef, newUserProfile)
      return { success: true }
    } catch (error: any) {
      console.error("Error signing up:", error)
      let errorMessage = "Failed to create account"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak"
      }

      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      // Clear all state first
      setUser(null)
      setUserProfile(null)
      setNeedsOnboarding(false)
      
      // Then sign out from Firebase
      await firebaseSignOut(auth)
      
      console.log('User successfully signed out')
      
      // Clear any local storage items related to the user (if any)
      localStorage.removeItem('lastActiveDevice')
      localStorage.removeItem('userSettings')
      
      // The useEffect with onAuthStateChanged will also trigger and update the state
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error: any) {
      console.error("Reset password error:", error)
      let errorMessage = "Failed to send password reset email"

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      }

      return { success: false, error: errorMessage }
    }
  }

  const setOnboardingComplete = async () => {
    if (!user) return

    try {
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        onboardingComplete: true,
      })

      setNeedsOnboarding(false)
      setUserProfile((prev) => (prev ? { ...prev, onboardingComplete: true } : null))
    } catch (error) {
      console.error("Error updating onboarding status:", error)
      throw error
    }
  }

  // Check if user has a specific role
  const hasRole = (roles: string[]) => {
    if (!userProfile || !userProfile.role) return false
    return roles.includes(userProfile.role)
  }

  // Check if user has a specific permission
  const hasPermission = (permission: string) => {
    if (!userProfile || !userProfile.permissions) return false
    return userProfile.permissions.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        needsOnboarding,
        signIn,
        signUp,
        signOut,
        resetPassword,
        setOnboardingComplete,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
