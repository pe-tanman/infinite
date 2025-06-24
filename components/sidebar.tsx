import React from 'react'

function Sidebar() {
  return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-3">
            <img src="/infinite_black_icon.png" alt="App Icon" className="w-40 h-40 rounded-full shadow-md" />
        </div>
        <div className="text-lg font-semibold text-gray-500">Recently Used</div>
        <ul className="space-y-2">
            <li className="p-2 rounded hover:bg-gray-700 cursor-pointer text-white">Item 1</li>
            <li className="p-2 rounded hover:bg-gray-700 cursor-pointer text-white">Item 2</li>
            <li className="p-2 rounded hover:bg-gray-700 cursor-pointer text-white">Item 3</li>
        </ul>
      </div>
  )
}

export default Sidebar