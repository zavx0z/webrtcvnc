import Statistics from "../features/share/components/Statistics"
import Video from "../features/share/components/Video"
import {inject, observer} from "mobx-react"
import React from "react"
import DataChannel from "../element/DataChannel"

export const loader = (everything) => async () => {
    try {
        await everything.atom.screenShare.screenCaptureStart()
        everything.atom.screenShare.initialization()
        return true
    } catch (e) {
        return false
    }
}

export const Component = inject('everything')
(observer(({everything: {atom: {screenShare}}}) => {
    return <>
        <Video RTC={screenShare}/>
        <DataChannel
            send={screenShare.sendData}
            data={screenShare.data}
            status={screenShare.dataChannelStatus}
        />
        <Statistics RTC={screenShare}/>
    </>
}))
