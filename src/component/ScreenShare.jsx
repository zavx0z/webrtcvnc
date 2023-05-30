import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import React, {Suspense, useEffect, useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import useAspectRatio from "../hooks/useAspectRatio"
import {Await, defer, Form, useFetcher, useLoaderData} from "react-router-dom"

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
    console.log('ScreenShare', 'loader', request.isError)
    capturedMediaStream = config
    return defer({
        stream: displayMedia.getMedia().then(stream => {
            capturedMediaStream.captured = true
            return stream
        }).catch(err => console.log(err)),
        capture: capturedMediaStream,
    })
}
export const shouldRevalidate = () => {
    let revalidate = false
    console.log('ScreenShare', 'shouldRevalidate', revalidate)
    return revalidate
}

export const action = () => async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('ScreenShare', 'action', data)
    switch (data.action) {
        case 'off':
            capturedMediaStream.setCaptured(false)
            break
        case 'hidden':
            capturedMediaStream.preview = false
            break
        case 'visible':
            capturedMediaStream.preview = true
            break
        default:
            break
    }
    return {'success': 'ok'}
}
export const Component = () => {
    const {stream, capture} = useLoaderData()
    const fetcher = useFetcher()
    const onended = () => fetcher.submit({action: 'off'}, {method: "post", action: "/share"})
    return <>
        <Suspense fallback={null}>
            <Await resolve={stream}>
                {stream => <Video
                    mediaStream={stream}
                    visible={capture.preview}
                    onended={onended}
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
                    disabled={!stream}
                    type="submit"
                    name="action"
                    value={capture.preview ? 'hidden' : 'visible'}
                >
                    {capture.preview ? <VisibilityOff/> : <Visibility/>}
                </IconButton>
                <IconButton
                    disabled={!stream}
                    type="submit"
                    name="action"
                    value={stream ? 'off' : 'on'}
                >
                    {stream ? <CancelPresentation/> : <PresentToAll/>}
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
