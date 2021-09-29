import React from "react";
import Home from "./pages/home";
import { Router } from "@reach/router";

import "./styles/style.css";
import TopPicks from "./pages/top-picks";

const App = () => {
    return (
        <Router>
            <Home path="/" />
            <TopPicks path="top-picks" />
        </Router>
    );
}

export default App;
