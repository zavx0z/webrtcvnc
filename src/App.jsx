import {shouldRevalidate} from "./component/ScreenShare"
import {Outlet} from "react-router-dom"
import {signalServer} from "./core/signalService"

export const webrtcvnc = [
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
                    const {Component, loader, action, shouldRevalidate} = await import("./component/ScreenShare")
                    const config = {
                        preview: true,
                        captured: false,
                    }
                    const {signalServer} = await import("./core/signalService")
                    const {displayMedia} = await import("./core/displayMedia")
                    return {
                        Component, shouldRevalidate,
                        loader: loader({config, signalServer, displayMedia}),
                        action: action(),
                    }
                }
            },
            {
                path: "client",
                async lazy() {
                    const {Component, loader} = await import("./component/ScreenMirror")
                    return {Component, loader: loader()}
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
            const {loader, shouldRevalidate, action, Component} = await import("./core/signalService")
            return {
                loader: loader(signalServiceConfig), shouldRevalidate, action, Component
            }
        }
    },
    {
        path: "/display-media",
        async lazy() {
            const config = {
                video: {displaySurface: "browser"},
                audio: true
            }
            const {loader, shouldRevalidate, action, Component} = await import("./core/displayMedia")
            return {
                loader: loader(config), shouldRevalidate, action, Component
            }
        }
    },
]
