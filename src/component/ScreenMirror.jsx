import DataChannel from "../element/DataChannel"
import React, {useRef} from "react"
import {inject, observer} from "mobx-react"
import Info from "../element/Info"
import {Box, Button, Skeleton} from "@mui/material"
import useAspectRatio from "../hooks/useAspectRatio"

const Video = (props) => {
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
            id={props.id}
            style={{
                display: props.connection === 'connected' ? 'flex' : 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
            controls
        />
        {props.connection === 'connecting' &&
            <Skeleton
                sx={{
                    display: 'flex',
                    width: width,
                    height: height
                }}
            />}
    </Box>
}
export const loader = (everything) => async () => {
    return true
}
export const Component = inject('everything')(observer(({everything: {atom: {screenMirror: props}}}) => {
    return <>
        <Video
            id={props.id}
            connection={props.connection}
        />
        <Info
            position={'top'}
            connection={props.connection}
            iceGathering={props.iceGathering}
            userName={props.usernameFragment}
                senderName={props.senderUsernameFragment}
            >
                <Button
                    fullWidth
                    size="small"
                    variant={"contained"}
                    color={'success'}
                    onClick={props.start}
                    disabled={props.connection === 'connected'}
                >
                    Подключиться
                </Button>
            </Info>
            <DataChannel
                position={'top'}
                send={props.sendData}
                data={props.data}
                status={props.dataChannelStatus}
            />
        </>
    }))


