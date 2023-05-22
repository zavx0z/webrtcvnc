import DataChannel from "./components/DataChannel"
import Statistics from "./components/Statistics"
import Video from "./components/Video"

const Share = ({store}) => <>
    <Video RTC={store}/>
    <DataChannel RTC={store}/>
    <Statistics RTC={store}/>
</>
export default Share