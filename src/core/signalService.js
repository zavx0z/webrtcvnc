import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot} from "firebase/firestore"
import {initializeApp} from "firebase/app"
import {Outlet} from "react-router-dom"
import React from "react"

export const signalServer = {
    candidateEventHandler: null,
    answerEventHandler: null,
    offerEventHandler: null,
    service: null,
    on: function (actionType, callback) {
        this.answerEventHandler = onSnapshot(collection(this.service, actionType), snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const data = change.doc.data()
                    callback(data)
                    // deleteDoc(doc(self.db, change.doc.id)).finally()
                }
            })
        })
    },
    off: async function (actionType, callback) {
        const oldItems = await getDocs(collection(this.service, actionType))
        oldItems.forEach(document => deleteDoc(doc(this.service, actionType, document.id)))
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
    emit: async function (actionType, arg) {
        await addDoc(collection(this.service, actionType), arg)
    },
}
export const loader = (firebaseConfig) => ({params, request}) => {
    console.log('SignalServer', 'loader', new URL(request.url).pathname, params.signalService)
    switch (params.signalService) {
        case 'firestore':
            signalServer.service = getFirestore(initializeApp(firebaseConfig))
            return {}
        default:
            request.isError = true
            throw new Response(`Signal Service >> ${params.signalService} << not supported`, {status: 500})
    }
}
export const shouldRevalidate = ({currentUrl, defaultShouldRevalidate}) => {
    let revalidate = !signalServer.service
    // revalidate = defaultShouldRevalidate
    console.log('SignalService', 'revalidate', currentUrl.pathname, revalidate)
    return revalidate
}
export const action = async ({params, request}) => {
    const data = Object.fromEntries(await request.formData())
    console.log('signalServer', 'action', data)
    return {'success': 'ok'}
}
export const Component = () => {
    return <Outlet context={{signalServer}}/>
}
Component.displayName = "SignalService"