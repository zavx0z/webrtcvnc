import {addMiddleware, types} from "mobx-state-tree"
import {io} from "socket.io-client"
import freeice from "freeice"
import adapter from 'webrtc-adapter'

console.log(adapter.browserDetails.browser, adapter.browserDetails.version)
const logMiddleware = (call, next) => {
    const moduleName = 'RTC'
    const arg = call.args[0]
    switch (call.name) {
        case 'changeStateConnection':
            console.log(moduleName, call.name, arg.target.connectionState)
            break
        case 'changeStateDataChannel':
            console.log(moduleName, call.name, arg.type)
            break
        case 'changeStateIceGathering':
            console.log(moduleName, call.name, arg.target.iceGatheringState)
            break
        case 'setCandidate':
            if (arg.candidate?.candidate)
                console.log(moduleName, call.name, arg.candidate.candidate)
            break
        case 'setTrack':
            console.log(moduleName, call.name, arg.track.label)
            break
        default:
            break
    }
    next(call)
}
const eventNegotiationNeeded = event => console.log('eventNegotiationNeeded', event)
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
        const createPeerConnection = () => {
            peerConnection = new RTCPeerConnection({iceServers: freeice()})
            peerConnection.addEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.addEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.addEventListener('icecandidate', self['setCandidate'])
            peerConnection.addEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.addEventListener('track', self['setTrack'])
            peerConnection.addTransceiver("video", {direction: "recvonly"})
            peerConnection.addTransceiver("audio", {direction: "recvonly"})
        }
        const destroyPeerConnection = () => {
            peerConnection.removeEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('icecandidate', self['setCandidate'])
            peerConnection.removeEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.removeEventListener('track', self['setTrack'])
            peerConnection = null
        }
        let dataChannel
        const destroyDataChannel = () => {
            dataChannel.removeEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.removeEventListener('closing', self['changeStateDataChannel'])
            dataChannel.removeEventListener('close', self['changeStateDataChannel'])
            dataChannel.removeEventListener('error', self['changeStateDataChannel'])
            dataChannel.removeEventListener('open', self['changeStateDataChannel'])
            dataChannel.removeEventListener('message', self['receiveData'])
            dataChannel = null
        }
        const createDataChannel = () => {
            dataChannel = peerConnection.createDataChannel('data', {negotiated: true, id: 0})
            dataChannel.addEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.addEventListener('closing', self['changeStateDataChannel'])
            dataChannel.addEventListener('close', self['changeStateDataChannel'])
            dataChannel.addEventListener('error', self['changeStateDataChannel'])
            dataChannel.addEventListener('open', self['changeStateDataChannel'])
            dataChannel.addEventListener('message', self['receiveData'])
        }
        const sio = io(String(self.signalServerAddress), {transports: ["websocket"]})
        const messageSendOffer = async () => {
            console.log('sendOffer')
            const offer = await peerConnection.createOffer({iceRestart: false})
            await peerConnection.setLocalDescription(offer)
            sio.emit('offer', offer)
        }
        const messageReceiveAnswer = ({answer, sender}) => peerConnection
            .setRemoteDescription(new RTCSessionDescription(answer))
            .then(() => console.log(answer.type, sender))
            .catch((err) => console.error("Error send answer", err))
        const messageReceiveCandidate = ({iceCandidate, sender}) => peerConnection
            .addIceCandidate(iceCandidate)
            .catch(err => console.error('Error adding received ice candidate', err))
        const destroy = () => {
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
        }
        return {
            afterCreate() {
                addMiddleware(self, logMiddleware)
            },
            beforeDestroy() {
                destroy()
            },
            start() {
                destroy()
                createPeerConnection()
                createDataChannel()
                sio.on('answer', messageReceiveAnswer)
                sio.on('candidate', messageReceiveCandidate)
                messageSendOffer().catch(error => console.log(error))
            },
            changeStateConnection(event) {
                self.connection = event.target.connectionState
            },
            changeStateDataChannel(event) {
                self.dataChannel = event.type
            },
            changeStateIceGathering(event) {
                self.iceGathering = event.target.iceGatheringState
            },
            setCandidate(event) {
                if (event.candidate?.candidate) {
                    self.candidate = event.candidate.candidate
                    sio.emit('candidate', event.candidate)
                }
            },
            setTrack(event) {
                const {videoRef} = self
                if (!videoRef.srcObject)
                    videoRef.srcObject = event.streams[0]
            },
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