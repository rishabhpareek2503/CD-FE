"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function HistoryRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard/history")
  }, [router])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
