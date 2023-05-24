import DataChannel from "../features/share/components/DataChannel"
import Statistics from "../features/share/components/Statistics"
import Video from "../features/share/components/Video"
import {inject, observer} from "mobx-react"

export const Component = inject('everything')
(observer(({everything: {atom: {screenShare}}}) => {
    return <>
        <Video RTC={screenShare}/>
        <DataChannel RTC={screenShare}/>
        <Statistics RTC={screenShare}/>
    </>
}))
export const loader = (everything) => async () => {
    try {
        await everything.atom.screenShare.screenCaptureStart()
        everything.atom.screenShare.initialization()
        return true
    } catch (e) {
        return false
    }
}