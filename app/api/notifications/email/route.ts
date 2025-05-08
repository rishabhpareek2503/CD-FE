import { NextResponse } from "next/server"
import { collection, getDocs, query, where } from "firebase/firestore"

import { db } from "@/lib/firebase"

// In a production environment, this would use Nodemailer
// For now, we'll simulate sending email notifications

export async function POST(request: Request) {
  try {
    const { subject, text, deviceId, level } = await request.json()

    // In a real application, you would:
    // 1. Get the list of users who should receive this notification
    // 2. Get their email addresses
    // 3. Send emails to all recipients

    // Simulate getting users who should receive this notification
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(query(usersRef, where("notificationPreferences.emailEnabled", "==", true)))

    const userCount = usersSnapshot.size
    console.log(`Sending email notification to ${userCount} users`)

    // In a real application, you would use Nodemailer to send emails
    // For now, we'll just log the notification details
    console.log("Email notification details:", {
      subject,
      text,
      deviceId,
      level,
      recipients: userCount,
    })

    return NextResponse.json({ success: true, recipients: userCount })
  } catch (error) {
    console.error("Error sending email notification:", error)
    return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 })
  }
}
