import {flow, types} from "mobx-state-tree"
import {addDoc, collection, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"


const neutronService = types
    .model({
        id: types.identifier,
        config: types.frozen({})
    })
    .volatile(self => ({}))
    .actions(self => {
        let roomRef
        let db
        return {
            afterCreate() {
                db = getFirestore(initializeApp(self.config))
            },
            async sendOffer(offer) {
                const roomId = roomRef.id
                console.log(roomId)
            },
            emit: flow(function* emit(actionType, arg) {
                switch (actionType) {
                    case "offer":
                        roomRef = yield addDoc(collection(db, "rooms"), arg)
                        console.log(roomRef)
                        break
                    default:
                        break
                }
            }),
            on: flow(function* on(actionType, callback) {
                switch (actionType) {
                    case "answer":
                        console.log(roomRef)
                        onSnapshot(roomRef, (doc) => {
                            console.log("Current data: ", doc.data())
                        })
                        break
                    default:
                        break
                }
            }),
        }
    })
export default neutronService