import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Client from './features/client/Client'
import {Provider} from "mobx-react"
import {Box, Link as MUILink} from "@mui/material"
import {createBrowserRouter, Link, RouterProvider} from "react-router-dom"
import "./index.css"
import RTCModelClient from "./features/client/RTCModelClient"
import RTCModelShare from "./features/share/RTCModelShare"
import Share from "./features/share/Share"

const App = () => {
    return <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            p: 2,
            gap: 2,
        }}>
        <MUILink component={Link} to={'/share'}>
            Share
        </MUILink>
        <MUILink component={Link} to={'/client'}>
            Client
        </MUILink>
    </Box>
}

const RTCStoreClient = RTCModelClient.create({
    id: 'video',
    signalServerAddress: "ws://0.0.0.0:8080",
})
const RTCStoreShare = RTCModelShare.create({
    id: 'RTCvideo',
    signalServerAddress: "ws://0.0.0.0:8000",
})

const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>
    },
    {
        path: "/client",
        element: <Client store={RTCStoreClient}/>,
    },
    {
        path: "/share",
        element: <Share store={RTCStoreShare}/>,
    },
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <Provider RTC={RTCStoreClient}>
        <RouterProvider router={router}/>
    </Provider>
)
