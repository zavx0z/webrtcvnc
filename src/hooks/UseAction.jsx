import {useFetchers} from "react-router-dom"

export const useAction = (type, action, value) => {
    const fetchers = useFetchers()
    const fetcher = fetchers.find(fetcher => fetcher.data?.type === type && fetcher.data?.action === action)
    if (!fetcher)
        return value
    switch (fetcher.data.value) {
        case 'true':
            return true
        case 'false':
            return false
        default:
            return fetcher.data.value
    }
}