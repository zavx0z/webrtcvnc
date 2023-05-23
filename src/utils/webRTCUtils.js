import * as sdpTransform from "sdp-transform"

export const usernameFragmentFromOffer = offer => {
    const obj = sdpTransform.parse(offer.sdp)
    const ufrag = obj.media[0].iceUfrag
    if (!ufrag) {
        console.error("Not found ufrag in offer")
        return null
    }
    return ufrag
    // const regex = /a=ice-ufrag:([\w\d]+)/
    // const match = offer.sdp.match(regex)
    // if (match) {
    //     return match[1]
    // } else {
    //     console.error("Не найдено значение ice-ufrag")
    // }
}
