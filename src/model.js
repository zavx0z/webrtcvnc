import {addMiddleware, flow, types} from "mobx-state-tree"
import {io} from "socket.io-client"
import freeice from "freeice"

const logMiddleware = (call, next) => {
    const moduleName = 'RTC'
    switch (call.name) {
        case 'changeStateConnection':
            console.log(moduleName, call.name, call.args[0])
            break
        case 'changeStateIceGathering':
            console.log(moduleName, call.name, call.args[0])
            break
        case 'setCandidate':
            console.log(moduleName, call.name, call.args[0])
            break
        default:
            break
    }
    next(call)
}

const sio = io("ws://127.0.0.1:8000", {transports: ["websocket"]}).on("connect", () => console.log("connected"))
const eventDataChannel = (event) => {
    console.log('eventConnectionStateChange', event)
}
const eventDataChannelOpen = (event) => {
    console.log('eventDataChannelOpen', event)
}
const RTCmodel = types
    .model('RTC', {})
    .volatile(self => ({
        connection: types.optional(types.enumeration('состояние соединения', [
            'new',
            'connected',
            'disconnected',
            'checking',
            'closed',
            'failed',
            'connecting',
        ]), 'new'),
        iceGathering: types.optional(types.enumeration('сбор кандидатов ICE ', [
            'new',
            'gathering',
            'complete'
        ]), 'new'),
        candidate: null,
    }))
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
        const eventConnectionStateChange = (event) => self['changeStateConnection'](event.target['connectionState'])
        const eventIceGatheringStateChange = (event) => self['changeStateIceGathering'](event.target['iceGatheringState'])
        const eventIceCandidate = (event) => {
            if (event.candidate) {
                self['setCandidate'](event.candidate.candidate)
                sio.emit('new-ice-candidate', event.candidate)
            } else self['setCandidate'](null)
        }
        return {
            changeStateConnection(status) {
                self.connection = status
            },
            changeStateIceGathering(iceGatheringState) {
                self.iceGatheringState = iceGatheringState
            },
            setCandidate(candidate) {
                self.candidate = candidate
            },
            afterCreate() {
                addMiddleware(self, logMiddleware)
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