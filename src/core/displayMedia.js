import {Outlet, useFetcher} from "react-router-dom"

let fetcher

export const displayMedia = {
    stream: null,
    captured: false,
    config: {
        video: {displaySurface: "browser"},
        audio: true
    },
    getMedia: async function (pathName) {
        return navigator.mediaDevices.getDisplayMedia(this.config).then(stream => {
            this.stream = stream
            setTimeout(() => fetcher.submit({action: 'setCaptured', value: true}, {method: "post"}), 0)
            return stream
        })
    },
    destroy: function () {
        if (this.stream) {
            let videoTrack = this.stream.getVideoTracks()[0]
            let audioTrack = this.stream.getAudioTracks()[0]
            if (videoTrack) {
                videoTrack.stop()
                this.stream.removeTrack(videoTrack)
            }
            if (audioTrack) {
                audioTrack.stop()
                this.stream.removeTrack(audioTrack)
            }
            this.stream = null
            fetcher.submit({action: 'setCaptured', value: false}, {method: "post"})
        }
    }
}
export const loader = (config) => ({params, request}) => {
    request.isError && request.abort()
    console.log('DisplayMedia', 'loader', new URL(request.url).pathname)
    displayMedia.config = config
    return true
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = false
    // revalidate = defaultShouldRevalidate
    console.log('DisplayMedia', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('DisplayMedia', data)
    switch (data.action) {
        case 'setCaptured':
            displayMedia.captured = data.value
            return {type: 'displayMedia', action: 'setCaptured', value: data.value}
            console.log('DisplayMedia', 'captured', displayMedia.captured)
            break
        case 'off':
            break
        default:
            break
    }
    return {'success': 'ok'}
}
export const Component = () => {
    fetcher = useFetcher()
    return <Outlet/>
}
Component.displayName = "DisplayMedia"