export const mediaStreamDestroy = (mediaStream) => {
    if (mediaStream) {
        let videoTrack = mediaStream.getVideoTracks()[0]
        let audioTrack = mediaStream.getAudioTracks()[0]
        if (videoTrack) {
            videoTrack.stop()
            mediaStream.removeTrack(videoTrack)
        }
        if (audioTrack) {
            audioTrack.stop()
            mediaStream.removeTrack(audioTrack)
        }
    }
}