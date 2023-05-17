import {flow, types} from "mobx-state-tree"
import {io} from "socket.io-client"
import freeice from "freeice"

const sio = io("ws://127.0.0.1:8000", {transports: ["websocket"]}).on("connect", () => console.log("connected"))
const RTCmodel = types
    .model('RTC', {})
    .actions(self => {
        let peerConnection
        let dataChannel

        const sendOffer = async () => {
            console.log('sendOffer')
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            sio.emit('offer', offer)
        }
        const receiveAnswer = async ({answer, sender}) => {
            console.log(answer.type, sender, answer)
            const remoteDesc = new RTCSessionDescription(answer)
            await peerConnection.setRemoteDescription(remoteDesc)
            console.log(peerConnection.iceGatheringState)
        }
        return {
            afterCreate() {
                peerConnection = new RTCPeerConnection({iceServers: freeice()})
                dataChannel = peerConnection.createDataChannel('data')
                dataChannel.addEventListener('open', console.log)
                peerConnection.addEventListener('icecandidate', console.log)
                peerConnection.addEventListener("icegatheringstatechange", console.log)
                peerConnection.addEventListener('connectionstatechange', console.log)
                sio.on('answer', receiveAnswer)
            },
            start: flow(function* () {
                try {
                    yield sendOffer()
                } catch (e) {
                    return Promise.reject(e)
                }
            }),
        }
    })
const RTC = RTCmodel.create({})
export default RTC