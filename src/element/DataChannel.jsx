import {Button, Paper, Table, TableBody, TableCell, TableRow, TextField, Typography} from "@mui/material"
import React, {useState} from "react"

const Container = ({children}) =>
    <Paper sx={theme => ({
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        width: theme.spacing(40),
        padding: theme.spacing(1),
        top: theme.spacing(1),
        left: theme.spacing(1),
    })}>
        {children}
    </Paper>

const DataChannel = ({send, data, status}) => {
    const [value, setValue] = useState()
    return <Container>
        <Table size={'small'}>
            <TableBody>
                <TableRow>
                    <TableCell>
                        Статус подключения
                    </TableCell>
                    <TableCell>
                        {status}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        <Typography>
            {data}
        </Typography>
        <TextField
            fullWidth
            onChange={e => setValue(e.target.value)}
        />
        <Button
            fullWidth
            variant={'contained'}
            onClick={() => send(value)}
        >
            Отправить данные
        </Button>
    </Container>
}
export default DataChannel