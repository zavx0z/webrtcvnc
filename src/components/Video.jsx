import React from "react"
import {inject, observer} from "mobx-react"

const Video = ({width, height, visible}) => {
    return <video
        id="video"
        style={{
            display: visible ? 'flex' : 'none',
            maxWidth: width,
            maxHeight: height,
        }}
        autoPlay
    />
}
export default inject('RTC')(observer(Video))