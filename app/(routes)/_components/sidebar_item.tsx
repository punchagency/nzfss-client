"use client"

import { usePathname, useRouter } from "next/navigation"

interface SidebarRoutesProps {
    id: string
    label: string
    href: string
}

const SidebarItem = ({
    id,
    label,
    href
}: SidebarRoutesProps) => {

  const pathname = usePathname()
  const router = useRouter()

  const isActive = 
    href === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname === href || pathname?.startsWith(`${href}/`) 

  const onClick = () => {
    router.push(href);
  }

  return (
    <button 
    key={id}
    onClick={onClick}
    type="button"
    className={`instant-anim flex items-center border border-[#00000033] text-[#000000] font-[500] pl-[16px] h-[46px] 3xl:h-[56px] md:text-[0.8rem] 2xl:text-[1rem] 3xl:text-[1.125rem] rounded-[16px] transform transition-all duration-200 ease-in-out active:scale-95 hover:bg-black hover:text-white ${isActive ? 'bg-[#000000] text-white' : ''}`}
>
    <span className="flex-1 text-left">{label}</span>
</button>
  )
}

export default SidebarItem