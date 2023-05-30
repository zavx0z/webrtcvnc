import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"
import {Outlet} from "react-router-dom"
import React from "react"

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
    console.log('SignalServer', 'loader', new URL(request.url).pathname, params.signalService)
    switch (params.signalService) {
        case 'firestore':
            signalServer.db = getFirestore(initializeApp(firebaseConfig))
            return {}
        default:
            request.isError = true
            throw new Response(`Signal Service >> ${params.signalService} << not supported`, {status: 500})
    }
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = !signalServer.db
    revalidate = defaultShouldRevalidate
    console.log('SignalService', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('signalServer', 'action', data)
    return {'success': 'ok'}
}
export const Component = () => <Outlet/>
Component.displayName = "SignalService"