import {createBrowserRouter, RouterProvider} from "react-router-dom"
import React from "react"
import {inject} from "mobx-react"
import {Component} from "./component/ScreenShare"

const App = ({everything}) => <RouterProvider router={createBrowserRouter([
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
            const {Component, loader} = await import("./component/ScreenShare")
            return {Component, loader: loader(everything)}
        }
    },
])}/>
export default inject('everything')(App)