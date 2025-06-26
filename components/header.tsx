import Link from 'next/dist/client/link'
import React from 'react'

const Header = () => {
  return (
      <div className='flex items-center m-2.5 h-10 absolute w-full top-0 left-0 pl-2 pr-12 justify-end'>
      <Link href="/signin">
        Sign In
          </Link>
      </div>
  )
}

export default Header