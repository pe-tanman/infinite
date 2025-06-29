import React from 'react';
import Markdown from 'react-markdown';

interface CalloutProps {
    content: string;
    type?: 'info' | 'warning' | 'error' | 'success';
}

const Callout: React.FC<CalloutProps> = ({ content, type = 'info' }) => {
    const getTypeStyles = () => {
        switch (type) {
            case 'info':
                return 'bg-blue-100 text-blue-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            case 'success':
                return 'bg-green-100 text-green-800';
            default:
                return '';
        }
    };

    const icon = () => {
        switch (type) {
            case 'info':
                return '💡';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            case 'success':
                return '✅';
            default:
                return '';
        }
    };

    return (
        <div className={`p-4 rounded mb-2 ${getTypeStyles()}`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon()}</span>
                <div>
                    <Markdown>{content}</Markdown>
                </div>
            </div>

        </div>
    );
};

export default Callout;