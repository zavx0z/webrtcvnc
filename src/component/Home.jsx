import {Box, Link as MUILink} from "@mui/material"
import {Link} from "react-router-dom"
import React from "react"

export const Component = ({sharePath}) =>
    <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            p: 2,
            gap: 2,
        }}>
        <MUILink component={Link} to={sharePath}>
            Share
        </MUILink>
        <MUILink component={Link} to={'/client'}>
            Client
        </MUILink>
    </Box>
export const ErrorBoundary = ()=>{
    return<>
    <h1>Ой... что-то пошло не так 😧</h1>
    </>
}