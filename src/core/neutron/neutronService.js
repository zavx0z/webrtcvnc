import {addMiddleware, flow, types} from "mobx-state-tree"
import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"

const logMiddleware = (call, next) => {
    const moduleName = 'FS'
    switch (call.name) {
        case 'off':
            if (call.type === "flow_return")
                console.log(moduleName, call.name, call.parentEvent.args[0])
            break
        case 'on':
            if (call.type === "flow_resume")
                console.log(moduleName, call.name, call.parentEvent.args[0])
            break
        case 'emit':
            console.log(moduleName, call.name, call.args[0])
            break
        default:
            break
    }
    next(call)
}

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
        let candidateEventHandler
        return {
            afterCreate() {
                addMiddleware(self, logMiddleware)
                self.db = getFirestore(initializeApp(self.config))
                self.off('offer')
                self.off('answer')
                self.off('candidate')
            },
            async emit(actionType, arg) {
                await addDoc(collection(self.db, actionType), arg)
            },
            on: flow(function* on(actionType, callback) {
                answerEventHandler = onSnapshot(collection(self.db, actionType), snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === "added") {
                            const data = change.doc.data()
                            callback(data)
                            // deleteDoc(doc(self.db, change.doc.id)).finally()
                        }
                    })
                })
            }),
            off: flow(function* off(actionType) {
                const oldItems = yield getDocs(collection(self.db, actionType))
                oldItems.forEach(document => deleteDoc(doc(self.db, actionType, document.id)))
                switch (actionType) {
                    case "offer":
                        offerEventHandler && offerEventHandler()
                        break
                    case "answer":
                        answerEventHandler && answerEventHandler()
                        break
                    case "candidate":
                        candidateEventHandler && candidateEventHandler()
                        break
                    default:
                        break
                }
            })
        }
    })
export default neutronService