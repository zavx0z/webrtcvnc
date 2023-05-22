import React from "react"
import Statistics from "./components/Statistics"
import DataChannel from "./components/DataChannel"
import Video from "./components/Video"


const Client = ({store}) => <>
    <Statistics RTC={store}/>
    <DataChannel RTC={store}/>
    <Video RTC={store}/>
</>

export default Client