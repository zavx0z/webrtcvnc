import {Table, TableBody, TableCell, TableRow} from "@mui/material"
import React from "react"

const Info = ({RTC}) => <Table size={'small'}>
    <TableBody>
        <TableRow>
            <TableCell>
                Статус подключения
            </TableCell>
            <TableCell>
                {RTC.connection}
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell>
                iceGathering
            </TableCell>
            <TableCell>
                {RTC.iceGathering}
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell>
                ufrag пользователя
            </TableCell>
            <TableCell>
                {RTC.usernameFragment}
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell>
                ufrag собеседника
            </TableCell>
            <TableCell>
                {RTC.senderUsernameFragment}
            </TableCell>
        </TableRow>
    </TableBody>
</Table>

export default Info