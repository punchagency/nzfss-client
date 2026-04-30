import PageRules from "./pageRules"
import { Suspense } from "react"

const RulesPage = () => {
  return (
    <div className="px-6">
      <Suspense fallback={<div>Loading...</div>}>
        <PageRules />
      </Suspense>
  </div>
  )
}

export default RulesPage