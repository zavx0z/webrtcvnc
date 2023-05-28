import {inject, observer} from "mobx-react"
import React, {Suspense, useEffect, useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import useAspectRatio from "../hooks/useAspectRatio"
import {applyPatch} from "mobx-state-tree"
import {Await, defer, Form, useFetcher, useLoaderData, useNavigate} from "react-router-dom"
import {everything} from "../index"

let mediaStream
const screenCaptureStart = async (screenShare) => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {displaySurface: "browser"},
        audio: true
    })
    const track = stream.getVideoTracks()[0]
    console.log(track.readyState)
    track.onended = async () => {
        console.log('Трек закончил воспроизведение')
        screenCaptureStop(screenShare)
    }
    track.onisolationchange = () => console.log('Трек был изолирован или отключен')
    track.onoverconstrained = () => console.log('Трек не может быть удовлетворен из-за ограничений настройки')
    screenShare.setCaptured(true)
    return stream
}
const screenCaptureStop = (mediaStream) => {
    console.log('clear screen share')
    if (mediaStream) {
        let videoTrack = mediaStream.getVideoTracks()[0]
        let audioTrack = mediaStream.getAudioTracks()[0]
        mediaStream.removeTrack(videoTrack)
        audioTrack && mediaStream.removeTrack(audioTrack)
    }
}
export const loader = (everything) => async ({params, request}) => {
    console.log('loading')
    applyPatch(everything, {
        path: '/atom/screenShare', op: 'add',
        value: {
            preview: true,
            captured: false,
            core: {signalService: everything.neutron.signalService}
        }
    })
    const {screenShare} = everything.atom
    const stream = screenCaptureStart(screenShare).then((stream) => {
        mediaStream = stream
        return stream
    })
    return defer({
        stream: stream,
        send: screenShare.sendData,
        data: screenShare.data,
        status: screenShare.dataChannelStatus,
    })
}
export const shouldRevalidate = (everything) => () => {
    console.log('should revalidate')
    return !Boolean(mediaStream)
}

export const action = (everything) => async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log(data)
    switch (data.action) {
        case 'clear':
            if (mediaStream.getVideoTracks()[0].readyState === 'ended') {
                screenCaptureStop(mediaStream)
                mediaStream = null
                everything.atom.screenShare.setCaptured(false)
            }
            break
        case 'hidden':
            everything.atom.screenShare.setPreview(false)
            break
        case 'visible':
            everything.atom.screenShare.setPreview(true)
            break
        default:
            break
    }
    return {'success': 'ok'}
}
export const Component = inject('everything')(observer(({everything}) => {
    const {screenShare: props} = everything.atom
    const {stream, send, data, status} = useLoaderData()
    const fetcher = useFetcher()

    const onended = () => {
        fetcher.submit({action: 'clear'}, {method: "post", action: "/share"})
    }
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
            send={send}
            data={data}
            status={status}
        />
    </>
}))


const Video = ({mediaStream, visible, onended}) => {
    const parentRef = useRef()
    const [width, height] = useAspectRatio(parentRef)
    const videoRef = useRef(null)
    useEffect(() => {
        console.log('mediaStream', mediaStream)
        if (videoRef.current && mediaStream && mediaStream.getTracks().length > 0) {
            const track = mediaStream.getVideoTracks()[0]
            track.onended = () => {
                onended()
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
