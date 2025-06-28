import React from 'react';

interface CalloutProps {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
}

const Callout: React.FC<CalloutProps> = ({ title, message, type = 'info' }) => {
    const getTypeStyles = () => {
        switch (type) {
            case 'info':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'error':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'success':
                return 'bg-green-100 text-green-800 border-green-300';
            default:
                return '';
        }
    };

    return (
        <div className={`border-l-4 p-4 rounded ${getTypeStyles()}`}>
            <h4 className="font-bold">{title}</h4>
            <p>{message}</p>
        </div>
    );
};

export default Callout;