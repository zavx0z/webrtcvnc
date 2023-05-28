import {Paper, Table, TableBody, TableCell, TableRow} from "@mui/material"
import React from "react"
import {observer} from "mobx-react"

const Container = ({children, position}) =>
    <Paper
        sx={theme => ({
            position: 'absolute',
            ...position === 'top' ? {top: theme.spacing(1)} : {bottom: theme.spacing(1)},
            right: theme.spacing(1),
            width: theme.spacing(40),
            padding: theme.spacing(1),
        })}>
        {children}
    </Paper>

const Info = (props) => <Container position={props.position}>
    <Table size={'small'}>
        <TableBody>
            <TableRow>
                <TableCell>
                    Статус подключения
                </TableCell>
                <TableCell>
                    {props.connection}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    iceGathering
                </TableCell>
                <TableCell>
                    {props.iceGathering}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    ufrag пользователя
                </TableCell>
                <TableCell>
                    {props.userName}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    ufrag собеседника
                </TableCell>
                <TableCell>
                    {props.senderName}
                </TableCell>
            </TableRow>
        </TableBody>
    </Table>
    {props.children}
</Container>
export default observer(Info)