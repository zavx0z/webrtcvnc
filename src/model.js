import {flow, types} from "mobx-state-tree"
import {io} from "socket.io-client"
import freeice from "freeice"

const sio = io("ws://127.0.0.1:8000", {transports: ["websocket"]}).on("connect", () => console.log("connected"))

const eventIceCandidate = (event) => {
    console.log('eventIceCandidate', event)
    if (event.candidate)
        sio.emit('new-ice-candidate', event.candidate)
}
const eventIceGatheringStateChange = (event) => {
    console.log('eventIceGatheringStateChange', event)
}
const eventConnectionStateChange = (event) => {
    console.log('eventConnectionStateChange', event)
}
const eventDataChannel = (event) => {
    console.log('eventConnectionStateChange', event)
}

const eventDataChannelOpen = (event) => {
    console.log('eventDataChannelOpen', event)
}

const RTCmodel = types
    .model('RTC', {})
    .actions(self => {
        let peerConnection
        let dataChannel

        const messageSendOffer = async () => {
            console.log('sendOffer')
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            sio.emit('offer', offer)
        }
        const messageReceiveAnswer = async ({answer, sender}) => {
            console.log(answer.type, sender, answer)
            const remoteDesc = new RTCSessionDescription(answer)
            await peerConnection.setRemoteDescription(remoteDesc)
        }
        return {
            afterCreate() {
                peerConnection = new RTCPeerConnection({iceServers: freeice()})
                peerConnection.addEventListener('icecandidate', eventIceCandidate)
                peerConnection.addEventListener("icegatheringstatechange", eventIceGatheringStateChange)
                peerConnection.addEventListener('connectionstatechange', eventConnectionStateChange)
                peerConnection.addEventListener('datachannel', eventDataChannel)

                dataChannel = peerConnection.createDataChannel('data')
                dataChannel.addEventListener('open', eventDataChannelOpen)

                sio.on('answer', messageReceiveAnswer)
            },
            start: flow(function* () {
                try {
                    yield messageSendOffer()
                } catch (e) {
                    return Promise.reject(e)
                }
            }),
        }
    })
const RTC = RTCmodel.create({})
export default RTC