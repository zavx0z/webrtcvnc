import {types} from "mobx-state-tree"

export const capturedMediaStream = types
    .model('capturedMediaStream', {
        preview: types.optional(types.boolean, false),
        captured: types.optional(types.boolean, false),
    })
    .volatile(self => ({}))
    .actions(self => ({
        setCaptured: bool => self.captured = bool,
        setPreview: bool => self.preview = bool,
    }))