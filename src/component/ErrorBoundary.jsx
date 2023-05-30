import {Button, Typography} from "@mui/material"
import {Link, useRouteError} from "react-router-dom"
import React from "react"

export const ErrorBoundary = () => {
    const error = useRouteError()
    console.log(error)
    const info = () => {
        switch (error.status) {
            case 404:
                return <>
                    <Typography variant={'h3'} align={'center'} variantMapping={{"h3": "h1"}}>
                        Ой...<br/>страница не найдена
                    </Typography>
                    <Typography paragraph variant={'h3'}>
                        🧐
                    </Typography>
                </>
            case 500:
                return <>
                    <Typography variant={'h3'} align={'center'} variantMapping={{"h3": "h1"}}>
                        Ой...<br/>что-то пошло не так
                    </Typography>
                    <Typography paragraph variant={'subtitle1'}>
                        {JSON.stringify(error.data, null, 2)}
                    </Typography>
                    <Typography paragraph variant={'h3'}>
                        😬
                    </Typography>
                </>
            default:
                return  <>
                    <Typography variant={'h3'} align={'center'} variantMapping={{"h3": "h1"}}>
                        Ой...<br/>что-то пошло не так
                    </Typography>
                    <Typography paragraph variant={'subtitle1'}>
                        {JSON.stringify(error.message, null, 2)}
                    </Typography>
                    <Typography paragraph variant={'h3'}>
                        😬
                    </Typography>
                </>
        }
    }
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
    }}>
        {info()}
        <Button
            component={Link}
            variant="contained"
            color="primary"
            to="/"
        >
            вернуться на главную
        </Button>
    </div>
}