import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-4xl font-bold mb-4 text-cyan-500">404</h2>
      <p className="text-gray-400 mb-6">Page not found</p>
      <Link href="/dashboard">
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}

