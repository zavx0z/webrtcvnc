import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import {Provider} from "mobx-react"
import RTC from "./model"

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <Provider RTC={RTC}>
        <App/>
    </Provider>
)
