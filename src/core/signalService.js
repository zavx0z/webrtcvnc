import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"
import {Outlet} from "react-router-dom"

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
    signalServer.db = getFirestore(initializeApp(firebaseConfig))
    console.log('signalServer', 'loader', 'initialized db')
    return {}
}
export const shouldRevalidate = () => {
    let revalidate = !signalServer.db
    console.log('signalServer', 'shouldRevalidate', revalidate)
    return revalidate
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('signalServer', 'action', data)
    return {'success': 'ok'}
}
export const Component = () => {
    return <>
        <Outlet/>
        {/*<h1>Signal Server</h1>*/}
        {/*<Link to={'../'}>Back</Link>*/}
    </>
}
Component.displayName = "SignalService"
