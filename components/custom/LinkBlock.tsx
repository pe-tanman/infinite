import React, { useState, useEffect } from 'react'

const CardLink = ({ props }) => {
    // リンクカード化するかどうかのチェックはプロトコルの有無で判断
    const checker = props.children.match(/(http)?/)[1] !== undefined
    const [embed, setEmbed] = useState({})

    const getEmbed = async () => {
        const data = await fetch(`https://iframe.ly/api/oembed?url=${props.children}&api_key=xxhogezzfugoyy...`)
            .then(res => res.json())
            .catch(error => error)
        setEmbed(data)
    }

    useEffect(() => {
        checker && getEmbed()
    }, [])


    return (
        <>
            {
                checker ? (
                    <a href={embed.url} target='_blank'>
                        <div>
                            <div>
                                <div style={{ background: `center / contain no-repeat url(${embed.thumbnail_url})` }}></div>
                            </div>
                            <div>
                                <div>{embed.title}</div>
                                <div>{embed.description}</div>
                            </div>
                        </div>
                    </a>
                ) : (
                    <a href={props.href} {...props}>{props.children}</a>
                )
            }
        </>
    )
}

export default CardLink