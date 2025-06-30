import Link from 'next/link'
import React from 'react'
import { TbLibrary } from 'react-icons/tb'
import NewChat from './new_chat'
import Image from 'next/image'

function Sidebar() {
  return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-3">
        <Image src="/infinite_white_icon.png" width={60} height={60} alt="App Icon" className="rounded-full" />
        <button>
          Infinite
        </button>
          </div>
          <div>
              <NewChat />
              <Link href="/" className="flex items-center gap-3 p-2 rounded-md text-gray-900 hover:bg-gray-300">
                  <TbLibrary/>
                  <div className="">Open Document</div>
              </Link>
          </div>
        <div className="h-4"></div>
        <div className="p-2 text-gray-600">Recently Used</div>
        <ul>
            <li className="p-2 rounded hover:bg-gray-300 cursor-pointer text-gray-900">Item 1</li>
            <li className="p-2 rounded hover:bg-gray-300 cursor-pointer text-gray-900">Item 2</li>
            <li className="p-2 rounded hover:bg-gray-300 cursor-pointer text-gray-900">Item 3</li>
        </ul>
      </div>
  )
}

export default Sidebar