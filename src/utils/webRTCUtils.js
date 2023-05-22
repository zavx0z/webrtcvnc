export const usernameFragmentFromOffer = offer => {
    const regex = /a=ice-ufrag:([\w\d]+)/
    const match = offer.sdp.match(regex)
    if (match) {
        return match[1]
    } else {
        console.error("Не найдено значение ice-ufrag")
    }
}
