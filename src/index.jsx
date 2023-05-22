import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Client from './features/client/Client'
import {Provider} from "mobx-react"
import {Box, Link as MUILink} from "@mui/material"
import {createBrowserRouter, Link, RouterProvider} from "react-router-dom"
import "./index.css"
import RTCModelClient from "./features/client/RTCModelClient"

const App = () => {
    return <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            p: 2,
            gap: 2,
        }}>
        <MUILink component={Link} to={'/client'}>
            Share
        </MUILink>
        <MUILink component={Link} to={'/client'}>
            Client
        </MUILink>
    </Box>
}

const RTCShareStore = RTCModelClient.create({
    id: 'video',
    signalServerAddress: "ws://0.0.0.0:8080",
})

const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>
    },
    {
        path: "/client",
        element: <Client store={RTCShareStore}/>,
    },
    {
        path: "/share",
        element: <Client/>,
    },
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <Provider RTC={RTCShareStore}>
        <RouterProvider router={router}/>
    </Provider>
)
