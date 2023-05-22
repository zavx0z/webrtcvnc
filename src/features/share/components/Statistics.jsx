import {Button, Paper, Table, TableBody, TableCell, TableRow} from "@mui/material"
import {inject, observer} from "mobx-react"
import React from "react"

const Container = ({children}) => <Paper sx={theme => ({
    position: 'absolute',
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    width: theme.spacing(40),
    padding: theme.spacing(1),
})}>
    {children}
</Paper>

const Statistics = ({RTC}) => {
    return <Container>
        <Table size={'small'}>
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
            </TableBody>
        </Table>
        <Button
            fullWidth
            size="small"
            variant={"contained"}
            color={'success'}
            onClick={RTC.preview ? RTC.hidePreview : RTC.showPreview}
            disabled={RTC.connection === 'connected'}
        >
            {RTC.preview ? "Скрыть " : "Показать "}превью видео
        </Button>
    </Container>
}
export default inject('RTC')(observer(Statistics))