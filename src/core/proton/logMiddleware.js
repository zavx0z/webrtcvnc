import adapter from 'webrtc-adapter'
console.log(adapter.browserDetails.browser, adapter.browserDetails.version)

export const logMiddleware = (call, next, abort) => {
    const moduleName = 'RTC'
    const arg = call.args[0]
    switch (call.name) {
        case 'setSenderUserNameFragment':
            console.log(moduleName, call.name, arg)
            break
        case 'setUserNameFragment':
            console.log(moduleName, call.name, arg)
            break
        case 'changeStateConnection':
            console.log(moduleName, call.name, arg.target.connectionState, arg)
            break
        case 'changeStateDataChannel':
            console.log(moduleName, call.name, arg.type)
            break
        case 'changeStateIceGathering':
            console.log(moduleName, call.name, arg.target.iceGatheringState)
            break
        case 'receiveCandidate':
            if (arg.usernameFragment !== call.context.senderUsernameFragment)
                return abort('not senderUsernameFragment equal')
            else
                console.log(moduleName, call.name, `from: ${arg.usernameFragment}`)
            break
        case 'sendCandidate':
            if (arg.candidate?.candidate)
                console.log(moduleName, call.name, `from: ${arg.candidate.usernameFragment}`)
            break
        case 'setTrack':
            console.log(moduleName, call.name, arg.track.label)
            break
        default:
            break
    }
    next(call)
}