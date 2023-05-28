import {types} from "mobx-state-tree"

export const peerConnection = types
    .model('peerConnection', {
        id: types.identifier,
        state: types.optional(types.enumeration('состояние соединения', [
            'new',
            'connected',
            'disconnected',
            'checking',
            'closed',
            'failed',
            'connecting',
        ]), 'new'),
        ice: types.optional(types.enumeration('сбор кандидатов ICE ', [
            'new',
            'gathering',
            'complete'
        ]), 'new'),
    })
    .actions(self => ({
        setIce: ice => self.ice = ice,
        setState: status => self.status = status,
    }))
