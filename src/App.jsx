import {createBrowserRouter, RouterProvider, useFetcher} from "react-router-dom"
import React from "react"
import {inject} from "mobx-react"
import {Component, shouldRevalidate} from "./component/ScreenShare"
import {addMiddleware, applyPatch} from "mobx-state-tree"

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
                if (!everything.stream) {
                    const initValue = {
                        preview: true,
                        captured: false,
                    }
                    applyPatch(everything, {op: 'add', path: '/capturedMediaStream', value: initValue})
                    const {logMiddleware} = await import("./component/screenShare/logging")
                    addMiddleware(everything.capturedMediaStream, logMiddleware)
                }
                const {Component, loader, action, shouldRevalidate} = await import("./component/ScreenShare")
                return {
                    Component,
                    shouldRevalidate: shouldRevalidate(everything.capturedMediaStream),
                    loader: loader(everything.capturedMediaStream),
                    action: action(everything.capturedMediaStream)
                }
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