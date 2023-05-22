import React from "react"
import Statistics from "./components/Statistics"
import DataChannel from "./components/DataChannel"
import Video from "./components/Video"
import FireStore from "../../FireStore"


const Client = ({store}) => <>
    <Statistics RTC={store}/>
    <DataChannel RTC={store}/>
    <Video RTC={store}/>
    <FireStore/>
</>

export default Client