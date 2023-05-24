import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {Provider} from "mobx-react"
import "./index.css"
import {addMiddleware, getParent, types} from "mobx-state-tree"
import App from "./App"
import neutronService from "./core/neutron/neutronService"
import atomScreenMirror from "./atom/atomScreenMirror"
import atomScreenShare from "./atom/atomScreenShare"

const neutronServiceInstance = neutronService.create({
    id: 'firestore',
    config: {
        apiKey: "AIzaSyDluLj6FqSyGDc8gBnULGrO71CCNkkg5Eg",
        authDomain: "webrtcvnc.firebaseapp.com",
        projectId: "webrtcvnc",
        storageBucket: "webrtcvnc.appspot.com",
        messagingSenderId: "134452625511",
        appId: "1:134452625511:web:936e0c299ca297f2b154c2",
        measurementId: "G-0EVKJ5EBNY"
    }
})

const model = types
    .model({
        atom: types.model('atom', {
            screenShare: atomScreenShare,
            screenMirror: atomScreenMirror,
        }),
        proton: types.model('proton', {}),
        neutron: types.model('neutron', {
            signalService: neutronService,
        }),
    })

export const everything = model.create({
    neutron: {
        signalService: neutronServiceInstance
    },
    atom: {
        screenShare: atomScreenShare.create({
            id: 'RTCvideo',
            core: {
                signalService: neutronServiceInstance
            }
        }),
        screenMirror: atomScreenMirror.create({
            id: 'video',
            core: {
                signalService: neutronServiceInstance
            }
        })
    },
    proton: {}
})
// addMiddleware(everything, (call, next) => {
//     console.log('I', call)
//     if (call.name === 'off'){
//         console.log(getParent(call.context, 1))
//     }
//     next(call)
// })
ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider everything={everything}>
        <App/>
    </Provider>
)
