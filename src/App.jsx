import {createBrowserRouter, RouterProvider, useFetcher} from "react-router-dom"
import React from "react"
import {inject} from "mobx-react"
import {Component, shouldRevalidate} from "./component/ScreenShare"

const App = ({everything}) => {
    return <RouterProvider router={createBrowserRouter([
        {
            path: '/',
            async lazy() {
                return await import("./component/Home")
            }
        },
        {
            path: "/client",
            async lazy() {
                const {Component, loader} = await import("./component/ScreenMirror")
                return {Component, loader: loader(everything)}
            }
        },
        {
            path: "/share",
            async lazy() {
                const {Component, loader, action, shouldRevalidate} = await import("./component/ScreenShare")
                return {Component, shouldRevalidate: shouldRevalidate(everything), loader: loader(everything), action: action(everything)}
            }
        },
        {
            path: "/state",
            loader: ({params, request}) => {
                console.log('state request', params, request)
                const {atom: {screenShare}} = everything
                return {
                    captured: screenShare.captured,
                    preview: screenShare.preview,
                }
            },
            action: ({params, request}) => {
                console.log('state request', params, request)
                console.log('action', params, request)
            }
        },
    ])}/>
}
export default inject('everything')(App)