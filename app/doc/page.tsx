import Welcome from '@/markdown/about.mdx';
import React from 'react';


const DocPage = () => {
    return (
        <div
            className=" bg-white my-20 mx-12 p-10 rounded-2xl overflow-y-auto max-h-[90vh] max-w-full box-border border-gray-300">
            <Welcome />
        </div>
            );
};

export default DocPage;