import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Client from './features/client/Client'
import {Provider} from "mobx-react"
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import "./index.css"
import RTCModelClient from "./features/client/RTCModelClient"
import RTCModelShare from "./features/share/RTCModelShare"
import Share from "./features/share/Share"
import {types} from "mobx-state-tree"
import {App} from "./App"
import {modelSignalService} from "./features/service/modelSignalService"

const modelEverything = types
    .model({
        share: RTCModelShare,
        client: RTCModelClient,
        signalService: modelSignalService,
    })

const everything = modelEverything.create({
    signalService: modelSignalService.create({
        config: {
            apiKey: "AIzaSyDluLj6FqSyGDc8gBnULGrO71CCNkkg5Eg",
            authDomain: "webrtcvnc.firebaseapp.com",
            projectId: "webrtcvnc",
            storageBucket: "webrtcvnc.appspot.com",
            messagingSenderId: "134452625511",
            appId: "1:134452625511:web:936e0c299ca297f2b154c2",
            measurementId: "G-0EVKJ5EBNY"
        }
    }),
    share: RTCModelShare.create({
        id: 'RTCvideo',
        signalServerAddress: "ws://0.0.0.0:8000",
    }),
    client: RTCModelClient.create({
        id: 'video',
        signalServerAddress: "ws://0.0.0.0:8080",
    }),
})

const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>
    },
    {
        path: "/client",
        element: <Client store={everything.client}/>,
    },
    {
        path: "/share",
        loader: async () => {
            try {
                await everything.share.shareScreen()
                return true
            } catch (e) {
                return false
            }
        },
        element: <Share store={everything.share}/>,
    },
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <Provider everything={everything}>
        <RouterProvider router={router}/>
    </Provider>
)
