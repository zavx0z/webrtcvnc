import React, {useRef} from "react"
import {inject, observer} from "mobx-react"
import {Box} from "@mui/material"
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
                display: 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay
        />
    </Box>
}
export default inject('RTC')(observer(Video))