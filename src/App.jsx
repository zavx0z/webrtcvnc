import React, {useRef} from "react"
import {inject, observer} from "mobx-react"

const App = ({RTC}) => {
    const inputRef = useRef()
    return <>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '200px',
            gap: '10px',
            padding: '10px',
            justifyContent: 'center',
        }}>
            {/*<p>Статус соединения: {RTC.connection}</p>*/}
            <h1>{RTC.data}</h1>
            <button onClick={RTC.start}>Start</button>
            <input ref={inputRef} type={'text'}/>
            <button onClick={() => RTC.sendData(inputRef.current.value)}>Отправить данные</button>
        </div>
        <video autoPlay id="video"/>
    </>
}

export default inject('RTC')(observer(App))