import {Button, Paper} from "@mui/material"
import {observer} from "mobx-react"
import React from "react"
import Info from "../../../electron/Info"

const Container = ({children}) => <Paper sx={theme => ({
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    width: theme.spacing(40),
    padding: theme.spacing(1),
})}>
    {children}
</Paper>

const Statistics = ({RTC}) =>
    <Container>
        <Info RTC={RTC}/>
        <Button
            fullWidth
            size="small"
            variant={"contained"}
            color={'success'}
            onClick={RTC.start}
            disabled={RTC.connection === 'connected'}
        >
            Подключиться
        </Button>
    </Container>

export default observer(Statistics)