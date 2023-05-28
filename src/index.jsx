import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {Provider} from "mobx-react"
import {types} from "mobx-state-tree"
import {createBrowserRouter, RouterProvider} from "react-router-dom"

import {webrtcvnc} from "./App"
import {signalService} from "./atom/signalService"
import {capturedMediaStream} from "./atom/capturedMediaStream"

const everything = types.model({
    signalService: types.maybeNull(signalService),
    capturedMediaStream: types.maybeNull(capturedMediaStream),
}).create()

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider everything={everything}>
        <RouterProvider router={createBrowserRouter([
            ...webrtcvnc(everything)
        ])}/>
    </Provider>
)
