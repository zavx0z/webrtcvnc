import React from 'react'
import {generatePath} from "react-router-dom"

export const webrtcvnc = [{
    index: true,
    async lazy() {
        const signalService = 'firestore'
        const clientPath = generatePath('/:signalService/client', {signalService})
        const sharePath = generatePath('/:signalService/display/share', {signalService})
        const {Component} = await import("./component/Home")
        return {element: <Component sharePath={sharePath} clientPath={clientPath}/>}
    }
}, {
    path: "/:signalService",
    id: "signalService",
    async lazy() {
        const config = {
            apiKey: "AIzaSyDluLj6FqSyGDc8gBnULGrO71CCNkkg5Eg",
            authDomain: "webrtcvnc.firebaseapp.com",
            projectId: "webrtcvnc",
            storageBucket: "webrtcvnc.appspot.com",
            messagingSenderId: "134452625511",
            appId: "1:134452625511:web:936e0c299ca297f2b154c2",
            measurementId: "G-0EVKJ5EBNY"
        }
        const {loader, shouldRevalidate, action, Component} = await import("./core/signalService")
        return {loader: loader(config), shouldRevalidate, action, Component}
    }, children: [{
        path: "display",
        id: "display",
        async lazy() {
            const config = {
                video: {displaySurface: "browser"},
                audio: true
            }
            const {loader, shouldRevalidate, action, Component} = await import("./core/displayMedia")
            return {loader: loader(config), shouldRevalidate, action, Component}
        }, children: [{
            path: "share",
            id: "share",
            async lazy() {
                const config = {
                    preview: true,
                    captured: false,
                }
                const {displayMedia} = await import("./core/displayMedia")
                const {signalServer} = await import("./core/signalService")
                const {Component, loader, action, shouldRevalidate} = await import("./component/ScreenShare")
                return {loader: loader({config, signalServer, displayMedia}), shouldRevalidate, action, Component}
            }
        }]
    }, {
        path: "client",
        async lazy() {
            const {Component, loader} = await import("./component/ScreenMirror")
            return {Component, loader: loader()}
        }
    }]
}]
