import {addMiddleware, types} from "mobx-state-tree"
import freeice from "freeice"
import adapter from 'webrtc-adapter'
import neutronService from "../core/neutron/neutronService"

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
        case 'receiveCandidate':
            console.log(moduleName, call.name, arg['iceCandidate'].candidate)
            break
        case 'sendCandidate':
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
const atomScreenMirror = types
    .model('atomScreenMirror', {
        id: types.identifier,
        core: types.model('atomScreenShareCore', {
            signalService: types.reference(neutronService)
        }),
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
        let peerConnection
        const createPeerConnection = () => {
            peerConnection = new RTCPeerConnection({iceServers: freeice()})
            peerConnection.addEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.addEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.addEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.addEventListener('icecandidate', self['sendCandidate'])
            peerConnection.addEventListener('track', self['setTrack'])
        }
        const destroyPeerConnection = () => {
            peerConnection.removeEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('icecandidate', self['sendCandidate'])
            peerConnection.removeEventListener('track', self['setTrack'])
            peerConnection = null
        }
        let dataChannel
        const createDataChannel = () => {
            dataChannel = peerConnection.createDataChannel('data', {negotiated: true, id: 0})
            dataChannel.addEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.addEventListener('closing', self['changeStateDataChannel'])
            dataChannel.addEventListener('close', self['changeStateDataChannel'])
            dataChannel.addEventListener('error', self['changeStateDataChannel'])
            dataChannel.addEventListener('open', self['changeStateDataChannel'])
            dataChannel.addEventListener('message', self['receiveData'])
        }
        const destroyDataChannel = () => {
            dataChannel.removeEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.removeEventListener('closing', self['changeStateDataChannel'])
            dataChannel.removeEventListener('close', self['changeStateDataChannel'])
            dataChannel.removeEventListener('error', self['changeStateDataChannel'])
            dataChannel.removeEventListener('open', self['changeStateDataChannel'])
            dataChannel.removeEventListener('message', self['receiveData'])
            dataChannel = null
            self['dataChannel'] = 'close'
        }
        // ------------------------------------------------------------------------------------------------
        const initial = () => {
            createPeerConnection()
            createDataChannel()
            peerConnection.addTransceiver("video", {direction: "recvonly"})
            peerConnection.addTransceiver("audio", {direction: "recvonly"})
        }
        const destroy = () => {
            console.log('destroy!')
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
            if (self['videoRef'].srcObject)
                self['videoRef'].srcObject = null
            self.core.signalService.off('answer', messageReceiveAnswer)
            self.core.signalService.off('candidate', self['receiveCandidate'])
        }
        // ================================================================================================
        const messageSendOffer = async () => {
            console.log('sendOffer')
            const offer = await peerConnection.createOffer({iceRestart: false})
            await peerConnection.setLocalDescription(offer)
            await self.core.signalService.emit('offer', offer)
        }
        const messageReceiveAnswer = answer => peerConnection
            .setRemoteDescription(new RTCSessionDescription(answer))
            .then(() => console.log(answer.type))
            .catch(err => {
                console.log(err)
                destroy()
            })
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
                messageSendOffer()
                    .then(() => self.core.signalService.on('answer', messageReceiveAnswer))
                    .catch(error => console.log(error))
            },
            changeStateConnection(event) {
                self.connection = event.target.connectionState
                if (event.target.connectionState === 'close')
                    destroy()
                if (self.connection === ' failed')
                    console.log(peerConnection, dataChannel)
            },
            changeStateDataChannel(event) {
                self.dataChannel = event.type
                if (self.dataChannel === 'close') {
                    destroy()
                    self['connection'] = 'new'
                }

            },
            changeStateIceGathering(event) {
                self.iceGathering = event.target.iceGatheringState
            },
            receiveCandidate({iceCandidate, sender}) {
                peerConnection.addIceCandidate(iceCandidate)
                    .catch(err => console.error('Error adding received ice candidate', err))
            },
            sendCandidate(event) {
                if (event.candidate?.candidate) {
                    self.candidate = event.candidate.candidate
                    self.core.signalService.emit('candidate', event.candidate)
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
export default atomScreenMirror