import {useEffect, useState} from "react"

const useAspectRatio = (parentRef, w = 16, h = 9) => {
    const [[width, height], setWidthHeight] = useState([0, 0])

    useEffect(() => {
        const handleResize = () => {
            if (parentRef.current) {
                const rect = parentRef.current.getBoundingClientRect()
                const aspectRatio = w / h
                if (rect.height && rect.width / rect.height > aspectRatio) {
                    setWidthHeight([rect.height * aspectRatio, rect.height])
                } else {
                    setWidthHeight([rect.width, rect.width / aspectRatio])
                }
            }
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [parentRef, w, h])

    return [width, height]
}

export default useAspectRatio