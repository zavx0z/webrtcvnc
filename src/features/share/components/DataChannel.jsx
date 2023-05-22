import {Button, Paper, Table, TableBody, TableCell, TableRow, TextField, Typography} from "@mui/material"
import React, {useState} from "react"
import {inject, observer} from "mobx-react"

const Container = ({children}) =>
    <Paper sx={theme => ({
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        width: theme.spacing(40),
        padding: theme.spacing(1),
        bottom: theme.spacing(1),
        left: theme.spacing(1),
    })}>
        {children}
    </Paper>

const DataChannel = ({RTC}) => {
    const [value, setValue] = useState()
    return <Container>
        <Table size={'small'}>
            <TableBody>
                <TableRow>
                    <TableCell>
                        Статус подключения
                    </TableCell>
                    <TableCell>
                        {RTC.dataChannel}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
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
export default inject('RTC')(observer(DataChannel))