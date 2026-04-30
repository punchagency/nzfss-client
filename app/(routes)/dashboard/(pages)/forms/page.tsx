import { Suspense } from "react"
import FormPage from "./formPage"

/**
 * Forms page component that properly implements Suspense boundaries
 * for client components using useSearchParams.
 */
export default function FormsPage() {
  return (
    <div className="px-6">
      <Suspense fallback={<div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading form data...</span>
      </div>}>
        <FormPage />
      </Suspense>
    </div>
  )
}