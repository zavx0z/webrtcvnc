import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {Provider} from "mobx-react"
import "./index.css"
import {types} from "mobx-state-tree"
import App from "./App"
import neutronService from "./core/neutron/neutronService"
import atomScreenMirror from "./atom/atomScreenMirror"
import atomScreenShare, {streamModel} from "./atom/atomScreenShare"

export const neutronServiceInstance = neutronService.create({
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
        capturedMediaStream: types.maybeNull(streamModel),

        atom: types.model('atom', {
            screenMirror: types.maybeNull(atomScreenMirror),
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
        screenMirror: atomScreenMirror.create({
            id: 'video',
            core: {
                signalService: neutronServiceInstance
            }
        })
    },
    proton: {}
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider everything={everything}>
        <App/>
    </Provider>
)
