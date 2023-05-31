import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import React, {Suspense, useEffect, useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import useAspectRatio from "../hooks/useAspectRatio"
import {Await, defer, Form, useFetcher, useLoaderData} from "react-router-dom"
import {useAction} from "../hooks/UseAction"

let fetcher

let capturedMediaStream = {
    preview: true,
}
const peerConnection = {
    iceGathering: 'connection',
    usernameFragment: '',
    senderUsernameFragment: '',
    connection: 'new',
    dataChannelStatus: 'new',
    data: '',
    sendData: () => {
    },
}
export const loader = ({config, signalServer, displayMedia}) => async ({params, request}) => {
    request.isError && request.abort()
    const {pathname} = new URL(request.url)
    console.log('ScreenShare', 'loader', pathname)
    capturedMediaStream = config
    return defer({
        mediaStream: displayMedia.getMedia(pathname).catch(err => console.log(err)),
        capture: capturedMediaStream,
    })
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = false
    // revalidate = defaultShouldRevalidate
    console.log('ScreenShare', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const action = ({displayMedia}) => async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('ScreenShare', 'action', data)
    switch (data.action) {
        case 'off':
            displayMedia.destroy()
            break
        case 'hidden':
            capturedMediaStream.preview = false
            break
        case 'visible':
            capturedMediaStream.preview = true
            break
        case 'captured':
            break
        default:
            break
    }
    return {'success': 'ok'}
}
export const Component = ({displayMedia}) => {
    fetcher = useFetcher()
    const {mediaStream, capture} = useLoaderData()
    const captured = useAction("displayMedia", "setCaptured", displayMedia.captured)
    return <>
        <Suspense fallback={null}>
            <Await resolve={mediaStream}>
                {mediaStream => <Video
                    mediaStream={mediaStream}
                    visible={capture.preview}
                    onended={displayMedia.destroy}
                />}
            </Await>
        </Suspense>
        <Info
            position={'bottom'}
            connection={peerConnection.connection}
            iceGathering={peerConnection.iceGathering}
            userName={peerConnection.usernameFragment}
            senderName={peerConnection.senderUsernameFragment}
        >
            <Form method={'post'}>
                <IconButton
                    disabled={!captured}
                    type="submit"
                    name="action"
                    value={capture.preview ? 'hidden' : 'visible'}
                >
                    {capture.preview ? <VisibilityOff/> : <Visibility/>}
                </IconButton>
                <IconButton
                    type="submit"
                    name="action"
                    value={captured ? 'off' : 'on'}
                >
                    {captured ? <CancelPresentation/> : <PresentToAll/>}
                </IconButton>
            </Form>
        </Info>
        <DataChannel
            position={'bottom'}
            send={peerConnection.sendData}
            data={peerConnection.data}
            status={peerConnection.dataChannelStatus}
        />
    </>
}
const Video = ({mediaStream, visible, onended}) => {
    const parentRef = useRef()
    const [width, height] = useAspectRatio(parentRef)
    const videoRef = useRef(null)
    useEffect(() => {
        if (videoRef.current && mediaStream && mediaStream.getTracks().length > 0) {
            const track = mediaStream.getVideoTracks()[0]
            track.onended = () => {
                onended(videoRef.current)
                videoRef.current.load()
            }
            videoRef.current.srcObject = mediaStream
        }
    }, [mediaStream, onended])
    return <Box
        ref={parentRef}
        sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
        <video
            ref={videoRef}
            style={{
                display: visible ? 'flex' : 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
        />
    </Box>
}
Component.displayName = "ScreenShare"
