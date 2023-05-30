import {types} from "mobx-state-tree"
import freeice from "freeice"
import neutronService from "../core/signalService"
import {usernameFragmentFromOffer} from "../utils/webRTCUtils"

const eventNegotiationNeeded = event => console.log('eventNegotiationNeeded', event)
const atomScreenMirror = types
    .model('atomScreenMirror', {
        core: types.model('atomScreenShareCore', {
            signalService: types.safeReference(neutronService),
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
        dataChannelStatus: types.optional(types.enumeration('dataChannel', [
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
        peerConnection: null,
        dataChannel: null,
    }))
    .actions(self => {
        const createPeerConnection = () => {
            const peerConnection = new RTCPeerConnection({iceServers: freeice()})
            peerConnection.addEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.addEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.addEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.addEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.addEventListener('icecandidate', self['sendCandidate'])
            peerConnection.addEventListener('track', self['setTrack'])
            self.peerConnection = peerConnection
        }
        const destroyPeerConnection = () => {
            const {peerConnection} = self
            peerConnection.removeEventListener("icegatheringstatechange", self['changeStateIceGathering'])
            peerConnection.removeEventListener('connectionstatechange', self['changeStateConnection'])
            peerConnection.removeEventListener('datachannel', self['changeStateDataChannel'])
            peerConnection.removeEventListener("negotiationneeded", eventNegotiationNeeded)
            peerConnection.removeEventListener('icecandidate', self['sendCandidate'])
            peerConnection.removeEventListener('track', self['setTrack'])
            self.peerConnection = null
        }
        const createDataChannel = () => {
            const {peerConnection} = self
            const dataChannel = peerConnection.createDataChannel('data', {negotiated: true, id: 0})
            dataChannel.addEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.addEventListener('closing', self['changeStateDataChannel'])
            dataChannel.addEventListener('close', self['changeStateDataChannel'])
            dataChannel.addEventListener('error', self['changeStateDataChannel'])
            dataChannel.addEventListener('open', self['changeStateDataChannel'])
            dataChannel.addEventListener('message', self['receiveData'])
            self.dataChannel = dataChannel
        }
        const destroyDataChannel = () => {
            const {dataChannel} = self
            dataChannel.removeEventListener('bufferedamountlow', self['changeStateDataChannel'])
            dataChannel.removeEventListener('closing', self['changeStateDataChannel'])
            dataChannel.removeEventListener('close', self['changeStateDataChannel'])
            dataChannel.removeEventListener('error', self['changeStateDataChannel'])
            dataChannel.removeEventListener('open', self['changeStateDataChannel'])
            dataChannel.removeEventListener('message', self['receiveData'])
            self.dataChannel = null
        }
        // ------------------------------------------------------------------------------------------------
        const initialization = () => {
            createPeerConnection()
            createDataChannel()
            const {peerConnection} = self
            peerConnection.addTransceiver("video", {direction: "recvonly"})
            peerConnection.addTransceiver("audio", {direction: "recvonly"})
            self.core.signalService.on('candidate', self['receiveCandidate'])
        }
        const destroy = () => {
            const {peerConnection, dataChannel, destroyVideo, receiveCandidate, core: {signalService}} = self
            console.log('destroy!')
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
            destroyVideo()
            signalService.off('answer', messageReceiveAnswer)
            signalService.off('candidate', receiveCandidate)
        }
        // ================================================================================================
        const messageSendOffer = async () => {
            const {peerConnection} = self
            const offer = await peerConnection.createOffer({iceRestart: false})
            await peerConnection.setLocalDescription(offer)
            self['setUserNameFragment'](usernameFragmentFromOffer(offer))
            self.core.signalService.emit('offer', offer.toJSON())
        }
        const messageReceiveAnswer = answer => {
            const {peerConnection} = self
            peerConnection
                .setRemoteDescription(new RTCSessionDescription(answer))
                .then(() => self['setSenderUserNameFragment'](usernameFragmentFromOffer(answer)))
                .catch(err => {
                    console.log(err)
                    destroy()
                })
        }
        return {
            afterCreate() {
                // addMiddleware(self, logMiddleware)
            },
            beforeDestroy() {
                destroy()
            },
            start() {
                initialization()
                messageSendOffer()
                    .then(() => self.core.signalService.on('answer', messageReceiveAnswer))
                    .catch(error => console.log(error))
            },
            setUserNameFragment(username) {
                self.usernameFragment = username
            },
            setSenderUserNameFragment(username) {
                self.senderUsernameFragment = username
            },
            changeStateConnection(event) {
                self.connection = event.target.connectionState
                if (event.target.connectionState === 'close')
                    destroy()
                if (self.connection === ' failed')
                    destroy()
            },
            changeStateDataChannel(event) {
                self.dataChannelStatus = event.type
                if (self.dataChannelStatus === 'close') {
                    destroy()
                    self['connection'] = 'new'
                }
            },
            changeStateIceGathering(event) {
                self.iceGathering = event.target.iceGatheringState
            },
            receiveCandidate(iceCandidate) {
                const {peerConnection} = self
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
                const {dataChannel} = self
                if (data.length && dataChannel)
                    dataChannel.send(data)
            }
        }
    })
const modelScreen = types
    .model('screenReceiver', {
        id: types.identifier,
    })
    .actions(self => ({
        setTrack(event) {
            const {videoRef} = self
            if (!videoRef.srcObject) {
                const stream = event.streams[0]
                videoRef.srcObject = stream
                const track = stream.getTracks()[0] // todo get videoTrack
                // Устанавливаем обработчики событий на объект MediaStreamTrack
                track.onended = () => console.log('Трек закончил воспроизведение')
                // track.onmute = () => console.log('Трек был выключен')
                // track.onunmute = () => console.log('Трек был включен')
                track.onisolationchange = () => console.log('Трек был изолирован или отключен')
                track.onoverconstrained = () => console.log('Трек не может быть удовлетворен из-за ограничений настройки')
            }
        },
        destroyVideo() {
            const {videoRef} = self
            if (videoRef.srcObject)
                videoRef.srcObject = null
        },
    }))
    .views(self => ({
        get videoRef() {
            return document.getElementById(String(self.id))
        }
    }))
export default types.compose('atomScreenMirror', atomScreenMirror, modelScreen)
