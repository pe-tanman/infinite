import React from 'react'
import { FacebookEmbed, YouTubeEmbed, InstagramEmbed, PinterestEmbed, PlaceholderEmbed, TikTokEmbed, XEmbed } from 'react-social-media-embed';

const Link = ({ url }: { url: string }) => {
    if (url.includes("facebook.com") && url.includes("posts")) {
        return (
            <div className='flex justify-center'>
                <FacebookEmbed url={url} />
            </div>
        )
    }
    else if (url.includes("youtube.com/watch")) {
        return (
            <div className='flex justify-center'>
                <YouTubeEmbed url={url} />
            </div>
        )
    }
    else if (url.includes("instagram.com/p/")) {
        return (
            <div className='flex justify-center'>
                <InstagramEmbed url={url} />
            </div>
        )
    }
    else if (url.includes('linkedin.com/embed')) {
        return (
            <div>
                <iframe
                    src={url}
                    width="100%"
                    height="500"
                    allowFullScreen
                    title="LinkedIn Embed"
                ></iframe>
            </div>
        )
    }
    else if (url.includes('pinterest.co') && url.includes('/pin/')) {
        return (
            <div className='flex justify-center'>
                <PinterestEmbed url={url} />
            </div>
        )
    }
    else if (url.includes('tiktok.com')) {
        return (
            <div className='flex justify-center'>
                <TikTokEmbed url={url} />
            </div>
        )
    }
    else if (url.includes('x.com') || url.includes('twitter.com')) {
        return (
            <div className='flex justify-center'>
                <XEmbed url={url} />
            </div>
        )
    }
    else {
        
    }
}

export default Link