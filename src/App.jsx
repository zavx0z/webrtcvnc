import React, {useRef} from "react"
import Statistics from "./components/Statistics"
import DataChannel from "./components/DataChannel"
import {Box, Skeleton} from "@mui/material"
import useAspectRatio from "./useAspectRatio"
import {inject, observer} from "mobx-react"
import Video from "./components/Video"

const App = ({RTC}) => {
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
        <Video width={width} height={height} visible={RTC.connection === 'connected'}/>
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