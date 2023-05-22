import {flow, types} from "mobx-state-tree"
import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"


const neutronService = types
    .model({
        id: types.identifier,
        config: types.frozen({})
    })
    .volatile(self => ({
        db: null
    }))
    .actions(self => {
        let offerEventHandler
        let answerEventHandler
        return {
            afterCreate() {
                self.db = getFirestore(initializeApp(self.config))
            },
            emit: flow(function* emit(actionType, arg) {
                switch (actionType) {
                    case "offer":
                        const offer = {type: arg.type, sdp: arg.sdp}
                        yield addDoc(collection(self.db, "offer"), offer)
                        break
                    case "answer":
                        const answer = {type: arg.type, sdp: arg.sdp}
                        yield addDoc(collection(self.db, "answer"), answer)
                        break
                    default:
                        break
                }
            }),
            on: flow(function* on(actionType, callback) {
                switch (actionType) {
                    case "answer":
                        const oldAnswers = yield getDocs(collection(self.db, "answer"))
                        oldAnswers.forEach(document => deleteDoc(doc(self.db, 'answer', document.id)))

                        answerEventHandler = onSnapshot(collection(self.db, "answer"), snapshot => {
                            snapshot.docChanges().forEach(change => {
                                if (change.type === "added")
                                    callback(change.doc.data())
                            })
                        })
                        break
                    case "offer":
                        const oldOffers = yield getDocs(collection(self.db, "offer"))
                        oldOffers.forEach(document => deleteDoc(doc(self.db, 'offer', document.id)))

                        offerEventHandler = onSnapshot(collection(self.db, "offer"), snapshot => {
                            snapshot.docChanges().forEach(change => {
                                if (change.type === "added")
                                    callback(change.doc.data())
                            })
                        })
                        break
                    default:
                        break
                }
            }),
            off(actionType) {
                switch (actionType) {
                    case "offer":
                        offerEventHandler && offerEventHandler()
                        break
                    case "answer":
                        answerEventHandler && answerEventHandler()
                        break
                    default:
                        break
                }
            }
        }
    })
export default neutronService