import { Skeleton } from "@/components/ui/skeleton"
import { Loader } from "lucide-react"

export function Loading() {
  return (
    <div className="overflow-hidden flex justify-center items-center 'max-h-[70vh] h-[70vh] xl:h-[75vh] xl:max-h-[75vh]  2xl:max-h-[70vh] 2xl:h-[70vh] 2.5xl:h-[80vh] 2.5xl:max-h-[80vh] 3xl:h-[82vh] 3xl:max-h-[82vh] rounded-b-[12px]">
     <Loader className="w-[70px] h-[70px] animate-spin"/>
    </div>
  )
}
