import {addMiddleware, applyPatch} from "mobx-state-tree"
import {shouldRevalidate} from "./component/ScreenShare"
import {Outlet} from "react-router-dom"
import {signalServer} from "./atom/signalService"

export const webrtcvnc = (everything) => [
    {
        path: '/',
        element: <Outlet/>,
        children: [
            {
                index: true,
                async lazy() {
                    return await import("./component/Home")
                }
            },
            {
                path: "share",
                async lazy() {
                    console.log('share')
                    const {logMiddleware} = await import("./atom/logging")
                    const {Component, loader, action, shouldRevalidate} = await import("./component/ScreenShare")
                    const capturedMediaStreamConfig = {
                        preview: true,
                        captured: false,
                    }
                    applyPatch(everything, {op: 'add', path: '/capturedMediaStream', value: capturedMediaStreamConfig})
                    addMiddleware(everything.capturedMediaStream, logMiddleware)
                    const {signalServer} = await import("./atom/signalService")
                    return {
                        Component, shouldRevalidate,
                        loader: loader(everything.capturedMediaStream, signalServer),
                        action: action(everything.capturedMediaStream),
                    }
                }
            },
            {
                path: "client",
                async lazy() {
                    const {Component, loader} = await import("./component/ScreenMirror")
                    return {Component, loader: loader(everything)}
                }
            },
        ]
    },
    {
        path: "/signal-service",
        async lazy() {
            const signalServiceConfig = {
                apiKey: "AIzaSyDluLj6FqSyGDc8gBnULGrO71CCNkkg5Eg",
                authDomain: "webrtcvnc.firebaseapp.com",
                projectId: "webrtcvnc",
                storageBucket: "webrtcvnc.appspot.com",
                messagingSenderId: "134452625511",
                appId: "1:134452625511:web:936e0c299ca297f2b154c2",
                measurementId: "G-0EVKJ5EBNY"
            }
            const {loader, shouldRevalidate, action, Component} = await import("./atom/signalService")
            return {
                loader: loader(signalServiceConfig), shouldRevalidate, action, Component
            }
        }
    },
]
