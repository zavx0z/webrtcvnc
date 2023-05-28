import * as sdpTransform from "sdp-transform"

export const usernameFragmentFromOffer = offer => {
    const obj = sdpTransform.parse(offer.sdp)
    const ufrag = obj.media[0].iceUfrag
    if (!ufrag) {
        console.error("Not found ufrag in offer")
        return null
    }
    return ufrag
}
