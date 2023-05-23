import {createBrowserRouter, RouterProvider} from "react-router-dom"
import React from "react"
import ScreenMirror from "./molecule/ScreenMirror"
import ScreenShare from "./molecule/ScreenShare"
import {inject} from "mobx-react"
import Home from "./molecule/Home"

const App = ({everything}) => {
    return <RouterProvider router={createBrowserRouter([
        {
            path: '/',
            element: <Home/>
        },
        {
            path: "/client",
            element: <ScreenMirror store={everything.atom.screenMirror}/>,
        },
        {
            path: "/share",
            loader: async () => {
                try {
                    await everything.atom.screenShare.screenCaptureStart()
                    everything.atom.screenShare.initialization()
                    return true
                } catch (e) {
                    return false
                }
            },
            element: <ScreenShare store={everything.atom.screenShare}/>,
        },
    ])}/>
}
export default inject('everything')(App)