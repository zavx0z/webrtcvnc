import {types} from "mobx-state-tree"
import freeice from "freeice"
import neutronService from "./signalService"
import {usernameFragmentFromOffer} from "../utils/webRTCUtils"

const eventNegotiationNeeded = event => console.log(event.type)
const atomScreenShare = types
    .model({
        core: types.model('atomScreenShareCore', {
            signalService: types.reference(neutronService)
        }),
    })
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
            },
            beforeDestroy() {
                destroy()
            },
            initialization() {
                const {stream, captured} = self
                if (!captured) {
                    console.error('Изображение экрана не установлено')
                    return
                }
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

        }
    })

const peerConnectionModel = types
    .model('peerConnectionModel', {
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
    })
    .volatile(self => ({
        usernameFragment: null,
        senderUsernameFragment: null,
    }))
    .actions(self => ({
        setUserNameFragment(username) {
            self.usernameFragment = username
        },
        setSenderUserNameFragment(username) {
            self.senderUsernameFragment = username
        },
    }))

const dataModel = types
    .model('dataModel', {
        dataChannelStatus: types.optional(types.enumeration('dataChannel', [
            'bufferedamountlow',
            'closing',
            'error',
            'message',
            'close',
            'open',
        ]), 'close'),
    })
    .volatile(self => ({
        data: null,
        dataToSend: null,
    }))
    .actions(self => ({
        receiveData(event) {
            self.data = event.data
        },
        sendData(data) {
            self.dataToSend = data
            // if (data.length && dataChannel)
            //     dataChannel.send(data)
        },
    }))

export const streamModel = types
    .model('screenCapture', {
        preview: types.optional(types.boolean, false),
        captured: types.optional(types.boolean, false),
    })
    .volatile(self => ({}))
    .actions(self => ({
        setCaptured(bool) {
            self.captured = bool
        },
        setPreview(bool) {
            self.preview = bool
        },
    }))

export default types.compose('atomScreenShare', atomScreenShare, streamModel, dataModel, peerConnectionModel)