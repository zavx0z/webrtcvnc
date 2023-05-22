import DataChannel from "../features/share/components/DataChannel"
import Statistics from "../features/share/components/Statistics"
import Video from "../features/share/components/Video"

const ScreenShare = ({store}) => <>
    <Video RTC={store}/>
    <DataChannel RTC={store}/>
    <Statistics RTC={store}/>
</>
export default ScreenShare