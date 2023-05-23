import {addMiddleware, flow, getRoot, types} from "mobx-state-tree"
import freeice from "freeice"
import neutronService from "../core/neutron/neutronService"
import {usernameFragmentFromOffer} from "../utils/webRTCUtils"
import {logMiddleware} from "../core/proton/logMiddleware"

const videoMiddleware = (call, next) => {
    console.log(call.name)
    next(call)
}
const eventNegotiationNeeded = event => console.log(event.type)
const atomScreenShare = types
    .model({
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
    })
    .volatile(self => ({
        data: null,
        usernameFragment: null,
        senderUsernameFragment: null,
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
        }
        const destroyPeerConnection = () => {
            peerConnection.removeEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('datachannel', self['changeStateDataChannel'])
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
        }
        // ------------------------------------------------------------------------------------------------
        const destroy = () => {
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
            self.core.signalService.off('offer', messageReceiveOffer)
            self.core.signalService.off('candidate', self['receiveCandidate'])
        }
        // ================================================================================================
        const messageReceiveOffer = async offer => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            self['setSenderUserNameFragment'](usernameFragmentFromOffer(offer))
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            self['setUserNameFragment'](usernameFragmentFromOffer(answer))
            self.core.signalService.emit('answer', answer.toJSON())
        }
        return {
            afterCreate() {
                addMiddleware(self, logMiddleware)
                addMiddleware(getRoot(self), videoMiddleware)
            },
            beforeDestroy() {
                destroy()
            },
            setUserNameFragment(username) {
                self.usernameFragment = username
            },
            setSenderUserNameFragment(username) {
                self.senderUsernameFragment = username
            },
            initialization() {
                const {stream} = self
                if (!stream) {
                    console.log('Изображение экрана не установлено')
                    return
                }
                // destroy()
                createPeerConnection()
                createDataChannel()
                self.core.signalService.on('offer', messageReceiveOffer)
                self.core.signalService.on('candidate', self['receiveCandidate'])
                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
            },
            changeStateConnection(event) {
                self.connection = event.target.connectionState
                if (event.target.connectionState === 'close')
                    destroy()
                if (self.connection === ' failed')
                    destroy()
            },
            changeStateDataChannel(event) {
                self.dataChannel = event.type
            },
            changeStateIceGathering(event) {
                self.iceGathering = event.target.iceGatheringState
            },
            receiveCandidate(iceCandidate) {
                peerConnection.addIceCandidate(iceCandidate)
                    .catch(err => console.error('Error adding received ice candidate', err))
            },
            sendCandidate(event) {
                if (event.candidate?.candidate) {
                    self.core.signalService.emit('candidate', event.candidate.toJSON())
                }
            },
            receiveData(event) {
                self.data = event.data
            },
            sendData(data) {
                if (data.length && dataChannel)
                    dataChannel.send(data)
            },

        }
    })


const modelScreen = types
    .model('screenCapture', {
        id: types.identifier,
        preview: types.optional(types.boolean, false),
    })
    .volatile(self => ({
        stream: null,
        captured: false,
    }))
    .actions(self => ({
        showPreview() {
            const {videoRef, stream} = self
            videoRef.srcObject = stream
            videoRef.style.display = 'flex'
            self.preview = true
        },
        hidePreview() {
            const {videoRef} = self
            videoRef.srcObject = null
            videoRef.style.display = 'none'
            self.preview = false
        },
        screenCaptureStop() {
            self.stream.getTracks().forEach(track => track.stop())
            self.captured = false
        },
        screenCaptureStart: flow(function* () {
            const stream = yield navigator.mediaDevices.getDisplayMedia({
                video: {displaySurface: "browser"},
                audio: true
            })
            const track = stream.getTracks()[0]
            // Устанавливаем обработчики событий на объект MediaStreamTrack
            track.onended = () => {
                console.log('Трек закончил воспроизведение')
                self.hidePreview()
            }
            track.onmute = () => console.log('Трек был выключен')
            track.onunmute = () => console.log('Трек был включен')
            track.onisolationchange = () => console.log('Трек был изолирован или отключен')
            track.onoverconstrained = () => console.log('Трек не может быть удовлетворен из-за ограничений настройки')
            self.stream = stream
            self.captured = true
            if (self.preview)
                self.showPreview()
        }),

    }))
    .views(self => ({
        get videoRef() {
            return document.getElementById(String(self.id))
        }
    }))


export default types.compose('atomScreenShare', atomScreenShare, modelScreen)