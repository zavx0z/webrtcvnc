import {Box, Link as MUILink} from "@mui/material"
import {Link} from "react-router-dom"
import React from "react"

const Home = () => {
    return <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            p: 2,
            gap: 2,
        }}>
        <MUILink component={Link} to={'/share'}>
            Share
        </MUILink>
        <MUILink component={Link} to={'/client'}>
            Client
        </MUILink>
    </Box>
}
export default Home