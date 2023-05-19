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
        id: types.identifier,
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
        data: null,
        candidate: null,
    }))
    .actions(self => {
        const sio = io(String(self.signalServerAddress), {transports: ["websocket"]})
        let peerConnection
        const createPeerConnection = () => {
            peerConnection = new RTCPeerConnection({iceServers: freeice()})
            peerConnection.addEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.addEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.addEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.addEventListener('icecandidate', self['setCandidate'])
            peerConnection.addEventListener('track', self['setTrack'])
        }
        const destroyPeerConnection = () => {
            peerConnection.removeEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('icecandidate', self['setCandidate'])
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
        const messageReceiveCandidate = ({iceCandidate, sender}) => peerConnection
            .addIceCandidate(iceCandidate)
            .catch(err => console.error('Error adding received ice candidate', err))
        // ------------------------------------------------------------------------------------------------
        const initial = () => {
            createPeerConnection()
            createDataChannel()
            sio.on('candidate', messageReceiveCandidate)
            peerConnection.addTransceiver("video", {direction: "recvonly"})
            peerConnection.addTransceiver("audio", {direction: "recvonly"})
        }
        const destroy = () => {
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
            if (self['videoRef'].srcObject)
                self['videoRef'].srcObject = null
        }
        // ================================================================================================
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
        return {
            afterCreate() {
                addMiddleware(self, logMiddleware)
            },
            beforeDestroy() {
                destroy()
            },
            start() {
                destroy()
                initial()
                sio.on('answer', messageReceiveAnswer)
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
            return document.getElementById(String(self.id))
        }
    }))
const RTC = RTCmodel.create({
    id: 'video',
    signalServerAddress: "ws://0.0.0.0:8000",
})
export default RTC