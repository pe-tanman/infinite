"use client"
import React from 'react'
import { ImArrowUp } from 'react-icons/im'
import { TbPaperclip } from 'react-icons/tb'


const ChatInput = () => {
    const [prompt, setPrompt] = React.useState<string>("");
    return (
      <div className="w-full flex flex-col items-center justify-center  mx-auto pt-3">
            <form className="w-full flex items-center justify-between bg-gray-700 rounded-full py-2.5 px-5">
                <TbPaperclip className='text-2xl'/>
                <input type="text"
                    className='w-full px-3 bg-transparent outline-none'
                    onChange={(e) => setPrompt(e.target.value)}
                    value={prompt}></input>
                <button type="submit" className="text-white font-semibold px-4 py-2.5 bg-green-600 rounded-full hover:bg-green-700 transition-colors disabled:bg-gray-500"
                disabled={!prompt}>
                    <ImArrowUp/>
                </button>
            </form>
        </div>
  )
}

export default ChatInput