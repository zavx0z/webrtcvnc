import {inject, observer} from "mobx-react"
import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import React, {Suspense, useEffect, useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import useAspectRatio from "../hooks/useAspectRatio"
import {Await, defer, Form, useFetcher, useLoaderData} from "react-router-dom"
import {mediaStreamDestroy} from "../utils/mediaStreamUtils"

let mediaStream
// let dataChannel
// let peerConnection

export const loader = (capturedMediaStream) => async ({params, request}) => {
    return defer({
        stream: navigator.mediaDevices.getDisplayMedia({
            video: {displaySurface: "browser"},
            audio: true
        }).then(item => {
            capturedMediaStream.setCaptured(true)
            mediaStream = item
            return item
        }).catch(err => console.log(err)),
    })
}
export const shouldRevalidate = (capturedMediaStream) => () => {
    return !Boolean(mediaStream)
}

export const action = (capturedMediaStream) => async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    switch (data.action) {
        case 'off':
            mediaStreamDestroy(mediaStream)
            mediaStream = null
            capturedMediaStream.setCaptured(false)
            break
        case 'hidden':
            capturedMediaStream.setPreview(false)
            break
        case 'visible':
            capturedMediaStream.setPreview(true)
            break
        default:
            break
    }
    return {'success': 'ok'}
}
export const Component = inject('everything')(observer(({everything: {capturedMediaStream: props}}) => {
    const {stream} = useLoaderData()
    const fetcher = useFetcher()
    const onended = () => fetcher.submit({action: 'off'}, {method: "post", action: "/share"})
    return <>
        <Suspense fallback={null}>
            <Await resolve={stream}>
                {stream => <Video
                    mediaStream={mediaStream}
                    visible={props.preview}
                    onended={onended}
                />}
            </Await>
        </Suspense>
        <Info
            position={'bottom'}
            connection={props.connection}
            iceGathering={props.iceGathering}
            userName={props.usernameFragment}
            senderName={props.senderUsernameFragment}
        >
            <Form method={'post'}>
                <IconButton
                    disabled={!props.captured}
                    type="submit"
                    name="action"
                    value={props.preview ? 'hidden' : 'visible'}
                >
                    {props.preview ? <VisibilityOff/> : <Visibility/>}
                </IconButton>
                <IconButton
                    disabled={!props.captured}
                    type="submit"
                    name="action"
                    value={props.captured ? 'off' : 'on'}
                >
                    {props.captured ? <CancelPresentation/> : <PresentToAll/>}
                </IconButton>
            </Form>
        </Info>
        <DataChannel
            position={'bottom'}
            send={props.sendData}
            data={props.data}
            status={props.dataChannelStatus}
        />
    </>
}))


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
