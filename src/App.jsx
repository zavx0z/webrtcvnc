import React, {useEffect, useRef, useState} from "react"
import {inject, observer} from "mobx-react"


function WebRTC({RTC}) {
    const [isUsingSTUN, setIsUsingSTUN] = useState(false)
    const [isStarted, setIsStarted] = useState(false)
    const videoRef = useRef(null)
    const audioRef = useRef(null)
    let pc = null


    useEffect(() => {
        const negotiate = async () => {
            pc.addTransceiver("video", {
                direction: "recvonly", // предпочтительную направленность приемопередатчика https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/direction
            })
            pc.addTransceiver("audio", {direction: "recvonly"})
            await pc.setLocalDescription(await pc.createOffer())
            await new Promise((resolve) => {
                if (pc.iceGatheringState === "complete")
                    resolve()
                else {
                    const checkState = () => {
                        if (pc.iceGatheringState === "complete") {
                            pc.removeEventListener("icegatheringstatechange", checkState)
                            resolve()
                        }
                    }
                    pc.addEventListener("icegatheringstatechange", checkState)
                }
            })
            const offer = pc.localDescription
            const response = await fetch("http://0.0.0.0:8080/offer", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    sdp: offer.sdp,
                    type: offer.type,
                    video_transform: null,
                }),
            })
            const {sdp, type} = await response.json()
            const answer = new RTCSessionDescription({sdp, type})
            await pc.setRemoteDescription(answer)
        }
        const start = async () => {
            pc = new RTCPeerConnection(RTC.Configuration)
            // connect audio / video
            pc.addEventListener("track", (evt) => {
                if (evt.track.kind === "video") {
                    if (videoRef.current)
                        videoRef.current.srcObject = evt.streams[0]
                } else {
                    if (audioRef.current)
                        audioRef.current.srcObject = evt.streams[0]
                }
            })
            setIsStarted(true)
            try {
                await negotiate()
            } catch (error) {
                console.error(error)
            }
        }
        const stop = async () => {
            setIsStarted(false)
            // close peer connection
            setTimeout(() => {
                if (pc) {
                    pc.close()
                    pc = null
                }
            }, 500)
        }
        isStarted ? start() : stop()
        return stop
    }, [isStarted, isUsingSTUN])
    const handleToggleSTUN = () => setIsUsingSTUN(!isUsingSTUN)
    const handleConnect = () => {
        RTC.start()
            .catch((err) => console.log(err))
        setIsStarted(true)
    }
    const handleDisconnect = () => {
        RTC.stop()
        setIsStarted(false)
    }
    return <div>
        <h1>WebRTC Test</h1>
        <div>
            <label>
                <input type="checkbox" checked={isUsingSTUN} onChange={handleToggleSTUN}/>
                Use STUN
            </label>
        </div>
        {!isStarted ? <button onClick={handleConnect}>Connect</button> : <button onClick={handleDisconnect}>Disconnect</button>}
        <video ref={videoRef} autoPlay/>
        <audio ref={audioRef} autoPlay/>
    </div>
}

const App = ({RTC}) => {
    const inputRef = useRef()
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '200px',
        gap: '10px',
        padding: '10px',
        justifyContent: 'center',
    }}>
        {/*<p>Статус соединения: {RTC.connection}</p>*/}
        <h1>{RTC.data}</h1>
        <button onClick={RTC.start}>Start</button>
        <input ref={inputRef} type={'text'}/>
        <button onClick={() => RTC.sendData(inputRef.current.value)}>Отправить данные</button>
    </div>
}

export default inject('RTC')(observer(App))