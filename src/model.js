import {addMiddleware, flow, types} from "mobx-state-tree"
import {io} from "socket.io-client"
import freeice from "freeice"

const logMiddleware = (call, next) => {
    const moduleName = 'RTC'
    switch (call.name) {
        case 'changeStateConnection':
            console.log(moduleName, call.name, call.args[0].target.connectionState)
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
        case 'setTrack':
            console.log(moduleName, call.name, call.args[0].track.label)
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
            'bufferedamountlow',
            'closing',
            'error',
            'message',
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
            const offer = await peerConnection.createOffer({iceRestart: false})
            await peerConnection.setLocalDescription(offer)
            sio.emit('offer', offer)
        }
        const messageReceiveAnswer = async ({answer, sender}) => {
            console.log(answer.type, sender,
                // answer.sdp
            )
            const remoteDesc = new RTCSessionDescription(answer)
            await peerConnection.setRemoteDescription(remoteDesc)
        }
        const messageReceiveNewIceCandidate = ({iceCandidate, sender}) => peerConnection
            .addIceCandidate(iceCandidate)
            .catch(err => console.error('Error adding received ice candidate', err))
        const eventIceGatheringStateChange = (event) => self['changeStateIceGathering'](event.target['iceGatheringState'])
        const eventIceCandidate = (event) => {
            if (event.candidate?.candidate) {
                self['setCandidate'](event.candidate.candidate)
                sio.emit('new-ice-candidate', event.candidate)
            }
        }
        const eventNegotiationNeeded = event => console.log('eventNegotiationNeeded', event)
        const eventDataChannel = (event) => {
            console.log('eventConnectionStateChange', event)
        }
        const destroyDataChannel = () => {
        }
        const createDataChannel = () => {
            dataChannel = peerConnection.createDataChannel('data', {negotiated: true, id: 0})
            dataChannel.addEventListener('open', self['changeStateDataChannel'])
            dataChannel.addEventListener('close', self['changeStateDataChannel'])
            dataChannel.addEventListener('closing', self['changeStateDataChannel'])
            dataChannel.addEventListener('error', self['changeStateDataChannel'])
            dataChannel.addEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.addEventListener('message', self['receiveData'])
        }
        const createPeerConnection = () => {
            peerConnection = new RTCPeerConnection({iceServers: freeice()})
            peerConnection.addEventListener('icecandidate', eventIceCandidate)
            peerConnection.addEventListener("icegatheringstatechange", eventIceGatheringStateChange)
            peerConnection.addEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.addEventListener('datachannel', eventDataChannel)
            peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.addEventListener('track', self['setTrack'])
            peerConnection.addTransceiver("video", {direction: "recvonly"})
            peerConnection.addTransceiver("audio", {direction: "recvonly"})
        }
        const destroyPeerConnection = () => {
            peerConnection.removeEventListener('icecandidate', eventIceCandidate)
            peerConnection.removeEventListener("icegatheringstatechange", eventIceGatheringStateChange)
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener('datachannel', eventDataChannel)
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('track', self['setTrack'])
            peerConnection = null
        }
        return {
            changeStateDataChannel(event) {
                self.dataChannel = event.type
            },
            changeStateConnection(event) {
                self.connection = event.target['connectionState']
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
            setTrack(event) {
                self['videoRef'].srcObject = event.streams[0]
            },
            start: flow(function* () {
                try {
                    if (peerConnection)
                        destroyPeerConnection()
                    createPeerConnection()
                    createDataChannel()
                    sio.on('new-ice-candidate', messageReceiveNewIceCandidate)
                    sio.on('answer', messageReceiveAnswer)
                    yield messageSendOffer()
                } catch (e) {
                    return Promise.reject(e)
                }
            }),
            receiveData(event) {
                self.data = event.data
            },
            sendData(data) {
                if (data.length && dataChannel)
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