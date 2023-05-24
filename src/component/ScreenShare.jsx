import {inject, observer} from "mobx-react"
import React, {useRef} from "react"
import DataChannel from "../element/DataChannel"
import Info from "../element/Info"
import {Box, IconButton} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import useAspectRatio from "../hooks/useAspectRatio"
import {applyPatch} from "mobx-state-tree"
import {useLoaderData} from "react-router-dom"

export const loader = (everything) => async () => {
    applyPatch(everything, {
        path: '/atom/screenShare', op: 'add',
        value: {id: 'RTCvideo', core: {signalService: everything.neutron.signalService}}
    })

    try {
        await everything.atom.screenShare.screenCaptureStart()
        everything.atom.screenShare.initialization()
        return true
    } catch (e) {
        return false
    }
}
export const Component = inject('everything')(observer(({everything: {atom: {screenShare: props}}}) => {
    const {detach} = useLoaderData()
    return <>
        <Video id={props.id}/>
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
                {props.preview ? <VisibilityOff/> : <Visibility/>}
            </IconButton>
            <IconButton
                onClick={props.captured ? props.screenCaptureStop : props.screenCaptureStart}
            >
                {props.captured ? <CancelPresentation/> : <PresentToAll/>}
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

const Video = ({id}) => {
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
            id={id}
            style={{
                display: 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
        />
    </Box>
}
