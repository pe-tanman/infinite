"use client";

import React from 'react';
import { useImageCacheCleanup } from '@/hooks/useImageCacheCleanup';

interface ClientLayoutWrapperProps {
    children: React.ReactNode;
}

const ClientLayoutWrapper: React.FC<ClientLayoutWrapperProps> = ({ children }) => {
    // Clean up image cache on app startup
    useImageCacheCleanup();

    return <>{children}</>;
};

export default ClientLayoutWrapper;
