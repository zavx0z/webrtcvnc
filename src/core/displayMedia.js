import {Outlet, useOutletContext} from "react-router-dom"
import {useEffect} from "react"

export const displayMedia = {
    stream: null,
    captured: false,
    config: {
        video: {displaySurface: "browser"},
        audio: true
    },
    getMedia: async function () {
        return navigator.mediaDevices.getDisplayMedia(this.config)
            .then(stream => {
                this.stream = stream
                this.captured = true
                console.log(this.captured)
                return stream
            })
    },
    destroy: function () {
        if (this.stream) {
            let videoTrack = this.stream.getVideoTracks()[0]
            let audioTrack = this.stream.getAudioTracks()[0]
            videoTrack && videoTrack.stop()
            videoTrack && this.stream.removeTrack(videoTrack)
            audioTrack && audioTrack.stop()
            audioTrack && this.stream.removeTrack(audioTrack)
            this.stream = null
            this.captured = false
        }
    }
}
export const loader = (config) => ({params, request}) => {
    request.isError && request.abort()
    console.log(new URL(request.url).pathname, 'loader')
    displayMedia.config = config
    return true
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log(new URL(request.url).pathname, 'action', data)
    return {'success': 'ok'}
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = false
    console.log('DisplayMedia', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const Component = () => {
    useEffect(() => {
        console.log(displayMedia.captured)
    }, [displayMedia.captured])
    const context = useOutletContext()
    return <Outlet context={{displayMedia, ...context}}/>
}
Component.displayName = "DisplayMedia"