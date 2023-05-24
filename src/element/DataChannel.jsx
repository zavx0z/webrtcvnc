import {Button, Paper, Table, TableBody, TableCell, TableRow, TextField, Typography} from "@mui/material"
import React, {useState} from "react"

const Container = ({children, position}) =>
    <Paper sx={theme => ({
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        width: theme.spacing(40),
        padding: theme.spacing(1),
        ...position === 'top' ? {top: theme.spacing(1)} : {bottom: theme.spacing(1)},
        left: theme.spacing(1),
    })}>
        {children}
    </Paper>
const DataChannel = ({send, data, status, position}) => {
    const [value, setValue] = useState('')
    const handleChange = event => setValue(event.target.value)
    const handleSubmit = () => {
        send(value)
        setValue('')
    }
    return <Container position={position}>
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
            onChange={handleChange}
        />
        <Button
            fullWidth
            variant={'contained'}
            onClick={handleSubmit}
        >
            Отправить данные
        </Button>
    </Container>
}
export default DataChannel