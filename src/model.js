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
        case 'changeStateDataChannel':
            console.log(moduleName, call.name, call.args[0].type)
            break
        default:
            break
    }
    next(call)
}
const RTCmodel = types
    .model('RTC', {
        signalServerAddress: types.string,
        connection: types.optional(types.enumeration('connection', [
            'new',
            'connected',
            'disconnected',
            'checking',
            'closed',
            'failed',
            'connecting',
        ]), 'new'),
        dataChannel: types.optional(types.enumeration('dataChannel', [
            'close',
            'open',
        ]), 'close'),
        iceGathering: types.optional(types.enumeration('сбор кандидатов ICE ', [
            'new',
            'gathering',
            'complete'
        ]), 'new'),
    })
    .volatile(self => ({
        candidate: null,
    }))
    .actions(self => {
        let peerConnection
        let dataChannel
        const sio = io(
            String(self.signalServerAddress),
            {transports: ["websocket"]}
        ).on("connect", () => console.log("connected"))

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
        const messageReceiveNewIceCandidate = ({iceCandidate, sender}) =>
            peerConnection
                .addIceCandidate(iceCandidate)
                .catch(err => console.error('Error adding received ice candidate', err))

        const eventDataMessage = event => self['receiveData'](event.data)
        const eventConnectionStateChange = (event) => self['changeStateConnection'](event.target['connectionState'])
        const eventIceGatheringStateChange = (event) => self['changeStateIceGathering'](event.target['iceGatheringState'])
        const eventIceCandidate = (event) => {
            if (event.candidate?.candidate) {
                self['setCandidate'](event.candidate.candidate)
                sio.emit('new-ice-candidate', event.candidate)
            }
        }
        const eventTrack = async (event) => {
            console.log('eventTrack', event)
            self['videoRef'].srcObject = event.streams[0]
        }
        const eventNegotiationNeeded = event => {
            console.log('eventNegotiationNeeded', event)
        }
        const eventDataChannel = (event) => {
            console.log('eventConnectionStateChange', event)
        }
        return {
            changeStateDataChannel(event) {
                self.dataChannel = event.type
            },
            changeStateConnection(status) {
                self.connection = status
            },
            changeStateIceGathering(iceGatheringState) {
                self.iceGathering = iceGatheringState
            },
            setCandidate(candidate) {
                self.candidate = candidate
            },
            afterCreate() {
                addMiddleware(self, logMiddleware)
            },
            start: flow(function* () {
                try {
                    peerConnection = new RTCPeerConnection({iceServers: freeice()})
                    peerConnection.addEventListener('icecandidate', eventIceCandidate)
                    peerConnection.addEventListener("icegatheringstatechange", eventIceGatheringStateChange)
                    peerConnection.addEventListener('connectionstatechange', eventConnectionStateChange)
                    peerConnection.addEventListener('datachannel', eventDataChannel)
                    peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)

                    peerConnection.addTransceiver("video", {direction: "recvonly"})
                    peerConnection.addTransceiver("audio", {direction: "recvonly"})
                    peerConnection.addEventListener('track', eventTrack)
                    dataChannel = peerConnection.createDataChannel('data')
                    dataChannel.addEventListener('open', self['changeStateDataChannel'])
                    dataChannel.addEventListener('message', eventDataMessage)

                    sio.on('new-ice-candidate', messageReceiveNewIceCandidate)
                    sio.on('answer', messageReceiveAnswer)
                    yield messageSendOffer()
                } catch (e) {
                    return Promise.reject(e)
                }
            }),
            receiveData(data) {
                self.data = data
            },
            sendData(data) {
                dataChannel.send(data)
            }
        }
    })
    .views(self => ({
        get videoRef() {
            return document.getElementById('video')
        }
    }))
const RTC = RTCmodel.create({
    signalServerAddress: "ws://0.0.0.0:8000",
})
export default RTC