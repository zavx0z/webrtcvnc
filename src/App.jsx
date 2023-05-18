import React, {useRef} from "react"
import Statistics from "./components/Statistics"
import DataChannel from "./components/DataChannel"
import {Box, Skeleton} from "@mui/material"
import useAspectRatio from "./useAspectRatio"
import {inject, observer} from "mobx-react"

const App = ({RTC}) => {
    const parentRef = useRef()
    const [width, height] = useAspectRatio(parentRef)
    return <Box
        ref={parentRef}
        sx={theme => ({
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        })}>
        <video
            style={{
                display: RTC.connection === 'connected' ? 'flex' : 'none',
                maxWidth: width,
                maxHeight: height,
            }}
            autoPlay

            id="video"
        />
        {RTC.connection === 'connecting' &&
            <Skeleton
                sx={{
                    display: 'flex',
                    width: width,
                    height: height
                }}
            />}
        <Statistics/>
        <DataChannel/>
    </Box>
}

export default inject('RTC')(observer(App))