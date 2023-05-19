import React from "react"
import {inject, observer} from "mobx-react"

const Video = ({RTC, width, height, visible}) => {
    return <video
        id={RTC.id}
        style={{
            display: visible ? 'flex' : 'none',
            maxWidth: width,
            maxHeight: height,
        }}
        autoPlay
    />
}
export default inject('RTC')(observer(Video))