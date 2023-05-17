import {addMiddleware, flow, getRoot, types} from "mobx-state-tree"
import {io} from "socket.io-client"

const middleware = (call, next, abort) => {
    const {name, args} = call
    switch (name) {
        default:
            name && console.log(name, args)
            break
    }
    next(call)
}
const RTCmodel = types
    .model('RTC', {
        iceServers: types.optional(types.array(types.string), ["stun:stun.l.google.com:19302"]),
        isUsingSTUN: types.optional(types.boolean, true),
        status: types.optional(types.enumeration('status', [
            'STOPPED',
            'STARTED',
            'FETCHED',
        ]), 'STOPPED'),
    })
    .volatile(self => ({
        sio: null
    }))
    .actions(self => {
        let peerConnection = null
        const sio = io("ws://127.0.0.1:8000", {transports: ["websocket"]}).on("connect", () => console.log("connected"))
        const everything = getRoot(self)

        const sendOffer = async () => {
            console.log('sendOffer')
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            sio.emit('offer', offer)
        }
        const receiveAnswer = async ({answer, sender}) => {
            console.log(answer.type, sender, answer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
            console.log(peerConnection.iceGatheringState)
        }
        return {
            afterCreate() { // https://developer.mozilla.org/ru/docs/Web/API/RTCPeerConnection
                addMiddleware(everything, middleware)
                peerConnection = new RTCPeerConnection(self['Configuration'])
                peerConnection.addEventListener('icecandidate', console.log)
                peerConnection.addEventListener("icegatheringstatechange", console.log)
                peerConnection.addEventListener('connectionstatechange', console.log)
                sio.on('answer', receiveAnswer)
            },
            start: flow(function* () {
                try {
                    yield sendOffer()
                } catch (e) {
                    return Promise.reject(e)
                }
            }),
        }
    })
    .views(self => ({
        get Configuration() {
            const {isUsingSTUN, iceServers} = self
            let conf = {}
            if (isUsingSTUN) conf.iceServers = [{urls: iceServers[0]}]
            return conf
        }
    }))


const RTC = RTCmodel.create({
    isUsingSTUN: true,
})
export default RTC