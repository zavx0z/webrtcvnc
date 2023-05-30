import {addMiddleware, applyPatch} from "mobx-state-tree"
import {shouldRevalidate} from "./component/ScreenShare"
import {Outlet} from "react-router-dom"

export const webrtcvnc = (everything) => [
    {
        path: '/',
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
            const {loader, shouldRevalidate} = await import("./atom/signalService")
            return {
                loader: loader(signalServiceConfig), shouldRevalidate,
                element: <Outlet/>
            }
        },
        children: [
            {
                index: true,
                async lazy() {
                    console.log('index')
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
                    return {
                        Component, shouldRevalidate,
                        loader: loader(everything.capturedMediaStream),
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
            {
                path: "server",
                async lazy() {
                    return {
                        loader: () => {
                            console.log('server loader')
                            return {'success': true}
                        },
                        action: async ({params, request}) => {
                            const data = Object.fromEntries(await request.formData())
                            console.log('server action', request)
                            console.log(data)
                            return {'success': true}
                        },
                        element: <>hi</>
                    }
                }
            }
        ]
    }
]
