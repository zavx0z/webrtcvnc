import {Button, Paper, TextField, Typography} from "@mui/material"
import React, {useState} from "react"

const Container = ({children}) =>
    <Paper sx={theme => ({
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        width: theme.spacing(40),
        padding: theme.spacing(1),
        bottom: 0,
        left: 0,
    })}>
        {children}
    </Paper>

const DataChannel = ({RTC}) => {
    const [value, setValue] = useState()
    return <Container>
        <Typography>
            {RTC.data}
        </Typography>
        <TextField
            fullWidth
            onChange={e => setValue(e.target.value)}
        />
        <Button
            fullWidth
            variant={'contained'}
            onClick={() => RTC.sendData(value)}
        >
            Отправить данные
        </Button>
    </Container>
}
export default DataChannel