import Statistics from "../features/client/components/Statistics"
import DataChannel from "../features/client/components/DataChannel"
import Video from "../features/client/components/Video"
import React from "react"
import {inject, observer} from "mobx-react"

export const loader = (everything) => async () => {
    return true
}

export const Component = inject('everything')
(observer(({everything: {atom: {screenMirror}}}) => {
    return <>
        <Statistics RTC={screenMirror}/>
        <DataChannel RTC={screenMirror}/>
        <Video RTC={screenMirror}/>
    </>
}))


