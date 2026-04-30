import React from 'react'

interface NameProps {
    name: string;
}

const Name = ({name}: NameProps) => {
  return (
    <div className="text-start w-[8.5vw] -ml-2">
        <p className='truncate text-[0.833vw] font-[600] leading-[0.833vw]'>{name}</p>
    </div>
  )
}

export default Name