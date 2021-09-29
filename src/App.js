import React from "react";
import { Router } from "@reach/router";

import Home from "./pages/home";
import TopPicks from "./pages/top-picks";

import "./styles/style.css";

const App = () => {
    return (
        <Router>
            <Home path="/" />
            <TopPicks path="top-picks" />
        </Router>
    );
}

export default App;
