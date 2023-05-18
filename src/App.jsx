import React from "react"
import {inject, observer} from "mobx-react"
import Statistics from "./components/Statistics"
import DataChannel from "./components/DataChannel"
import {Box, Paper} from "@mui/material"


const App = ({RTC}) => {
    return <Paper sx={{
        padding: '10px',

    }}>
        <video
            style={{
                border: '1px solid'
            }}
            width={'100%'}
            autoPlay id="video"
        />
        <Statistics RTC={RTC}/>
        <DataChannel RTC={RTC}/>
    </Paper>
}

export default inject('RTC')(observer(App))