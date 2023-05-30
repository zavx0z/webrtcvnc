import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"

export const signalServer = {
    candidateEventHandler: null,
    answerEventHandler: null,
    offerEventHandler: null,
    db: null,
    on: (actionType, callback) => {
        this.answerEventHandler = onSnapshot(collection(this.db, actionType), snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const data = change.doc.data()
                    callback(data)
                    // deleteDoc(doc(self.db, change.doc.id)).finally()
                }
            })
        })
    },
    off: async (actionType, callback) => {
        const oldItems = await getDocs(collection(this.db, actionType))
        oldItems.forEach(document => deleteDoc(doc(this.db, actionType, document.id)))
        switch (actionType) {
            case "offer":
                this.offerEventHandler && this.offerEventHandler()
                break
            case "answer":
                this.answerEventHandler && this.answerEventHandler()
                break
            case "candidate":
                this.candidateEventHandler && this.candidateEventHandler()
                break
            default:
                break
        }
    },
    emit: async (actionType, arg) => {
        await addDoc(collection(this.db, actionType), arg)
    },
}
export const loader = (firebaseConfig) => ({params, request}) => {
    console.log('signalServer loader')
    signalServer.db = getFirestore(initializeApp(firebaseConfig))
    return {}
}
export const shouldRevalidate = () => {
    console.log('signalServer shouldRevalidate')
    return false
}
