import {addMiddleware, types} from "mobx-state-tree"
import freeice from "freeice"
import adapter from 'webrtc-adapter'
import atomScreenMirror from "./atomScreenMirror"
import neutronService from "../features/service/neutronService"

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
const eventNegotiationNeeded = event => console.log(event.type)
const atomScreenShare = types
    .model('atomScreenShare', {
        id: types.identifier,
        core: types.model('atomScreenShareCore', {
           signalService: types.reference(neutronService)
        }),
        connection: types.optional(types.enumeration('состояние соединения', [
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
        preview: false
    })
    .volatile(self => ({
        candidate: null,
        data: null,
    }))
    .actions(self => {
        let peerConnection
        const createPeerConnection = () => {
            peerConnection = new RTCPeerConnection({iceServers: freeice()})
            peerConnection.addEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.addEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.addEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.addEventListener('icecandidate', self['sendCandidate'])
            peerConnection.addEventListener('track', self['setTrack'])
            // sio.on('candidate', self['receiveCandidate'])
        }
        const destroyPeerConnection = () => {
            peerConnection.removeEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.removeEventListener('icecandidate', self['sendCandidate'])
            peerConnection.removeEventListener('track', self['setTrack'])
            // sio.off('candidate', self['receiveCandidate'])
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
        }
        // ------------------------------------------------------------------------------------------------
        let stream
        const initial = () => {
            createPeerConnection()
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
            createDataChannel()
        }
        const destroy = () => {
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
        }
        // ================================================================================================
        const messageReceiveOffer = async ({offer, sender}) => {
            console.log('RTC', offer.type, sender)
            if (!stream) {
                console.log('Изображение экрана не установлено')
                return
            }
            destroy()
            initial()
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            // sio.emit('answer', answer)
        }
        return {
            afterCreate() {
                addMiddleware(self, logMiddleware)
                // sio.on('offer', messageReceiveOffer)
            },
            beforeDestroy() {
                destroy()
            },
            shareScreen() {
                navigator.mediaDevices.getDisplayMedia({
                    video: {displaySurface: "browser"},
                    audio: true
                })
                    .then(videoStream => stream = videoStream)
                    .catch(error => console.error(error))
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
            receiveCandidate({iceCandidate, sender}) {
                peerConnection.addIceCandidate(iceCandidate)
                    .catch(err => console.error('Error adding received ice candidate', err))
            },
            sendCandidate(event) {
                if (event.candidate?.candidate) {
                    self.candidate = event.candidate.candidate
                    // sio.emit('candidate', event.candidate)
                }
            },
            receiveData(event) {
                self.data = event.data
            },
            sendData(data) {
                if (data.length && dataChannel)
                    dataChannel.send(data)
            },
            showPreview() {
                self['videoRef'].srcObject = stream
                self['videoRef'].style.display = 'flex'
                self.preview = true
            },
            hidePreview() {
                self['videoRef'].srcObject = null
                self['videoRef'].style.display = 'none'
                self.preview = false
            }
        }
    })
    .views(self => ({
        get videoRef() {
            return document.getElementById(String(self.id))
        }
    }))
export default atomScreenShare