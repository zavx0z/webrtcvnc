import {inject, observer} from "mobx-react"
import React, {useEffect, useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import useAspectRatio from "../hooks/useAspectRatio"
import {applyPatch} from "mobx-state-tree"
import {useLoaderData , fetcher} from "react-router-dom"

const screenCaptureStart = async (screenShare) => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {displaySurface: "browser"},
        audio: true
    })
    const track = stream.getTracks()[0] // todo get videoTrack
    track.onended = () => {
        console.log('Трек закончил воспроизведение')
        screenShare.hidePreview()
    }
    // track.onmute = () => console.log('Трек был выключен')
    // track.onunmute = () => console.log('Трек был включен')
    track.onisolationchange = () => console.log('Трек был изолирован или отключен')
    track.onoverconstrained = () => console.log('Трек не может быть удовлетворен из-за ограничений настройки')
    screenShare.setCaptured(true)
    return stream
}

export const loader = (everything) => async () => {
    applyPatch(everything, {
        path: '/atom/screenShare', op: 'add',
        value: {
            id: 'RTCvideo',
            preview: true,
            core: {signalService: everything.neutron.signalService}
        }
    })
    const { screenShare } = everything.atom
    try {
        const mediaStream = await screenCaptureStart(screenShare)
        // screenShare.initialization()
        return {mediaStream}
    } catch (e) {
        return false
    }
}
export const Component = inject('everything')(observer(({ everything: { atom: { screenShare: props } } }) => {
    const {mediaStream} = useLoaderData()
    const setVisible = () => props.setPreview(!props.preview)
    const setCapture = () => props.captured ? props.screenCaptureStop : screenCaptureStart(props)
    return <>
        <Video
            mediaStream={mediaStream}
            captured={props.captured}
            preview={props.preview}
        />
        <Info
            position={'bottom'}
            connection={props.connection}
            iceGathering={props.iceGathering}
            userName={props.usernameFragment}
            senderName={props.senderUsernameFragment}
        >
            <IconButton
                disabled={!props.captured}
                onClick={setVisible}
            >
                {props.preview ? <VisibilityOff /> : <Visibility />}
            </IconButton>
            <IconButton
                onClick={setCapture}
            >
                {props.captured ? <CancelPresentation /> : <PresentToAll />}
            </IconButton>
        </Info>
        <DataChannel
            position={'bottom'}
            send={props.sendData}
            data={props.data}
            status={props.dataChannelStatus}
        />
    </>
}))

const Video = ({mediaStream, captured, preview}) => {
    const parentRef = useRef()
    const [width, height] = useAspectRatio(parentRef)
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

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
                display: preview ? 'flex' : 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
        />
    </Box>
}
