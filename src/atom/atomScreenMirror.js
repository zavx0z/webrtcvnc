import {addMiddleware, types} from "mobx-state-tree"
import freeice from "freeice"
import neutronService from "../core/neutron/neutronService"
import {usernameFragmentFromOffer} from "../utils/webRTCUtils"
import {logMiddleware} from "../core/proton/logMiddleware"

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
        usernameFragment: null,
        senderUsernameFragment: null,
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
        const initialization = () => {
            createPeerConnection()
            createDataChannel()
            peerConnection.addTransceiver("video", {direction: "recvonly"})
            peerConnection.addTransceiver("audio", {direction: "recvonly"})
            self.core.signalService.on('candidate', self['receiveCandidate'])
        }
        const destroy = () => {
            console.log('destroy!')
            peerConnection && destroyPeerConnection()
            dataChannel && destroyDataChannel()
            self.destroyVideo()
            self.core.signalService.off('answer', messageReceiveAnswer)
            self.core.signalService.off('candidate', self['receiveCandidate'])
        }
        // ================================================================================================
        const messageSendOffer = async () => {
            const offer = await peerConnection.createOffer({iceRestart: false})
            await peerConnection.setLocalDescription(offer)

            self['setUserNameFragment'](usernameFragmentFromOffer(offer))
            self.core.signalService.emit('offer', offer.toJSON())
        }
        const messageReceiveAnswer = answer => {
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
                addMiddleware(self, logMiddleware)
            },
            beforeDestroy() {
                destroy()
            },
            destroyVideo() {
                if (self['videoRef'].srcObject)
                    self['videoRef'].srcObject = null
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
                self.dataChannel = event.type
                if (self.dataChannel === 'close') {
                    destroy()
                    self['connection'] = 'new'
                }

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
            setTrack(event) {
                const {videoRef} = self
                if (!videoRef.srcObject) {
                    const stream = event.streams[0]
                    videoRef.srcObject = stream
                    const track = stream.getTracks()[0]
                    // Устанавливаем обработчики событий на объект MediaStreamTrack
                    track.onended = () => console.log('Трек закончил воспроизведение')
                    track.onmute = () => console.log('Трек был выключен')
                    track.onunmute = () => console.log('Трек был включен')
                    track.onisolationchange = () => console.log('Трек был изолирован или отключен')
                    track.onoverconstrained = () => console.log('Трек не может быть удовлетворен из-за ограничений настройки')
                }
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