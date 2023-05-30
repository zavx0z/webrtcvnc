import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import {createBrowserRouter, Outlet, RouterProvider} from "react-router-dom"

import {webrtcvnc} from "./App"
import {ErrorBoundary} from "./component/ErrorBoundary"


ReactDOM.createRoot(document.getElementById('root')).render(
    <RouterProvider router={createBrowserRouter([{
        path: '/',
        element: <Outlet/>,
        ErrorBoundary,
        children: webrtcvnc
    }])}/>
)
