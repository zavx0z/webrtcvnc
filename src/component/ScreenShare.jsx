import { inject, observer } from "mobx-react"
import React, { useRef } from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import { Box, IconButton } from "@mui/material"
import { CancelPresentation, PresentToAll, Visibility, VisibilityOff } from "@mui/icons-material"
import useAspectRatio from "../hooks/useAspectRatio"
import { applyPatch } from "mobx-state-tree"
import { useLoaderData } from "react-router-dom"

const screenCaptureStart = async (screenShare) => {
    const stream = yield navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
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
        value: { id: 'RTCvideo', core: { signalService: everything.neutron.signalService } }
    })
    const { screenShare } = everything.atom
    try {
        await screenCaptureStart()
        screenShare.initialization()
        return { stream }
    } catch (e) {
        return false
    }
}
export const Component = inject('everything')(observer(({ everything: { atom: { screenShare: props } } }) => {
    const { stream } = useLoaderData()
    return <>
        <Video
            stream={stream}
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
                onClick={props.preview ? props.hidePreview : props.showPreview}
            >
                {props.preview ? <VisibilityOff /> : <Visibility />}
            </IconButton>
            <IconButton
                onClick={props.captured ? props.screenCaptureStop : props.screenCaptureStart}
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

const Video = ({ stream, captured, preview }) => {
    const parentRef = useRef()
    const [width, height] = useAspectRatio(parentRef)
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
            src={stream}
            style={{
                display: 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
        />
    </Box>
}
