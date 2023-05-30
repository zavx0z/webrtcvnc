import {Outlet} from "react-router-dom"

export const displayMedia = {
    stream: null,
    config: {
        video: {displaySurface: "browser"},
        audio: true
    },
    getMedia: async function () {
        return navigator.mediaDevices.getDisplayMedia(this.config).then(stream => {
            this.stream = stream
            return stream
        })
    }
}
export const loader = (config) => ({params, request}) => {
    request.isError && request.abort()
    displayMedia.config = config
    return true
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    switch (data.action) {
        case 'off':
            break
        default:
            break
    }
    return {'success': 'ok'}
}
export const shouldRevalidate = () => {
    return true
}
export const Component = () => {
    return <Outlet/>
}
Component.displayName = "DisplayMedia"