// components/ToggleList.js
"use client";

import { useState } from 'react';

interface ToggleListProps {
    label: string;
    children: React.ReactNode;
}

const ToggleList = ({ label, children }: ToggleListProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem' }}>
            <button
                onClick={toggleOpen}
                className="w-full px-4 py-3 text-left cursor-pointer font-bold flex items-center border-none bg-transparent hover:bg-gray-100 focus:outline-none transition"
                type="button"
            ><span className='mr-3'>{isOpen ? '▼' : '▶︎'}</span>

                {label}
              
            </button>
            {isOpen && (
                <div style={{ padding: '1rem' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default ToggleList;