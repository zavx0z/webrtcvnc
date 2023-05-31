import {Outlet, useFetcher, useMatches, useNavigation} from "react-router-dom"

let fetcher
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
                setTimeout(() => fetcher.submit({action: 'setCaptured', value: true}, {method: "post"}), 0)
                return stream
            })
            .catch(() => setTimeout(() => fetcher.submit({action: 'setCaptured', value: false}, {method: "post"}), 0))
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
            fetcher.submit({action: 'setCaptured', value: false}, {method: "post"})
        }
    }
}
export const handle = {
    captured: false,
}
export const loader = (config) => ({params, request}) => {
    request.isError && request.abort()
    console.log('DisplayMedia', 'loader', new URL(request.url).pathname)
    displayMedia.config = config
    return true
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    let response
    switch (data.action) {
        case 'setCaptured':
            handle.captured = data.value === 'true' ? true : false
            response = {type: 'displayMedia', action: 'setCaptured', value: data.value}
            break
        default:
            response = {type: 'displayMedia', action: 'default', value: data}
            break
    }
    console.log(response)
    return response
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = false
    // revalidate = defaultShouldRevalidate
    console.log('DisplayMedia', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const Component = () => {
    fetcher = useFetcher()
    return <Outlet context={{displayMedia: displayMedia}}/>
}
Component.displayName = "DisplayMedia"