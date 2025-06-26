"use client"
import { useRouter } from 'next/navigation'
import React from 'react'
import { FaPlus } from 'react-icons/fa6'

const NewChat = () => {
    const router = useRouter()
    const createNewDocument = async() => {
       router.push("/doc/${docId}")
    }
    return (
      <button className="flex items-center gap-3 rounded-md text-gray-900 hover:bg-gray-300 p-2"
      onClick={createNewDocument}>
          <FaPlus />
          <div className="">New Document</div>
      </button>
  )
}

export default NewChat