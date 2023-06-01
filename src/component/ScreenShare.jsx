import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import React, {Suspense, useEffect, useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import useAspectRatio from "../hooks/useAspectRatio"
import {Await, defer, useLoaderData, useOutletContext} from "react-router-dom"

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
    console.log('ScreenShare', 'loader', new URL(request.url).pathname)
    capturedMediaStream = config
    return defer({
        mediaStream: displayMedia.getMedia(),
        capture: capturedMediaStream,
    })
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = false
    console.log('ScreenShare', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('ScreenShare', 'action', data)
    return {'success': 'ok'}
}
export const Component = () => {
    const {displayMedia, signalServer} = useOutletContext()
    const {mediaStream, capture} = useLoaderData()
    useEffect(() => {
        console.log(displayMedia.captured)
    }, [displayMedia.captured])
    return <>
        <Suspense fallback={null}>
            <Await resolve={mediaStream}>
                {mediaStream => <Video
                    mediaStream={mediaStream}
                    visible={capture.preview}
                    onended={() => displayMedia.destroy()}
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
            <IconButton
                disabled={!displayMedia.captured}
                value={capture.preview ? 'hidden' : 'visible'}
            >
                {capture.preview ? <VisibilityOff/> : <Visibility/>}
            </IconButton>
            <IconButton
                value={displayMedia.captured ? 'off' : 'on'}
                onClick={displayMedia.destroy}
            >
                {displayMedia.captured ? <CancelPresentation/> : <PresentToAll/>}
            </IconButton>
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
