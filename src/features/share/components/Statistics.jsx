import {IconButton, Paper} from "@mui/material"
import {CancelPresentation, PresentToAll, Visibility, VisibilityOff} from "@mui/icons-material"
import {observer} from "mobx-react"
import React from "react"
import Info from "../../../element/Info"

const Container = ({children}) => <Paper sx={theme => ({
    position: 'absolute',
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    width: theme.spacing(40),
    padding: theme.spacing(1),
})}>
    {children}
</Paper>

const Statistics = ({RTC}) => <Container>
    <Info RTC={RTC}/>
    <IconButton
        disabled={!RTC.captured}
        onClick={RTC.preview ? RTC.hidePreview : RTC.showPreview}
    >
        {RTC.preview ? <VisibilityOff/> : <Visibility/>}
    </IconButton>
    <IconButton
        onClick={RTC.captured ? RTC.screenCaptureStop : RTC.screenCaptureStart}
    >
        {RTC.captured ? <CancelPresentation/> : <PresentToAll/>}
    </IconButton>
</Container>
export default observer(Statistics)