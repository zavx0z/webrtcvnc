import {initializeApp} from "firebase/app"
import {collection, getDocs, getFirestore} from "firebase/firestore"
import {useEffect} from "react"

const firebaseConfig = {
    apiKey: "AIzaSyDluLj6FqSyGDc8gBnULGrO71CCNkkg5Eg",
    authDomain: "webrtcvnc.firebaseapp.com",
    projectId: "webrtcvnc",
    storageBucket: "webrtcvnc.appspot.com",
    messagingSenderId: "134452625511",
    appId: "1:134452625511:web:936e0c299ca297f2b154c2",
    measurementId: "G-0EVKJ5EBNY"
}
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)


const FireStore = () => {

    const data = async () => {
        const querySnapshot = await getDocs(collection(db, "rooms"))
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data()}`)
        })
    }

    useEffect(() => {
        data().then()
    }, [])
    return <></>
}
export default FireStore