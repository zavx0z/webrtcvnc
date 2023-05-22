import Statistics from "../features/client/components/Statistics"
import DataChannel from "../features/client/components/DataChannel"
import Video from "../features/client/components/Video"
import React from "react"

const ScreenMirror = ({store}) => <>
    <Statistics RTC={store}/>
    <DataChannel RTC={store}/>
    <Video RTC={store}/>
</>
export default ScreenMirror