import React, {useRef} from "react"
import {observer} from "mobx-react"
import {Box, Skeleton} from "@mui/material"
import useAspectRatio from "../../../hooks/useAspectRatio"

const Video = ({RTC}) => {
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
            id={RTC.id}
            style={{
                display: RTC.connection === 'connected' ? 'flex' : 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
        />
        {RTC.connection === 'connecting' &&
            <Skeleton
                sx={{
                    display: 'flex',
                    width: width,
                    height: height
                }}
            />}
    </Box>

}
export default observer(Video)