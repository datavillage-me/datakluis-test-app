import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {HashRouter, Route, Switch} from 'react-router-dom';
import './app.scss';
import {Welcome} from "./pages/welcome";
import {AdminPanel} from "./pages/admin";
import {SolidDashboard} from "./pages/solid";
import {DvTemplateAuth} from "./auth";
import {AppNavBar} from "./navbar";
import {ErrorBoundary} from "./utils/ui-utils";
import {createTheme, ThemeProvider} from "@mui/material";


const routes = [
    {
        component: Welcome,
        exact: true,
        path: '/',
        requiresAuth: false
    },
    {
        component: SolidDashboard,
        exact: false,
        path: '/solid',
        requiresAuth: true
    },
    {
        component: AdminPanel,
        exact: false,
        path: '/admin',
        requiresAuth: true
    }
];

const theme = createTheme({
    palette: {
        primary: {
            main: '#d0e0e6',
        },
        secondary: {
            main: '#00fff0',
        }
    }
});

export const App = () => {
        return (
            <ThemeProvider theme={theme}>
            <DvTemplateAuth.SessionProvider>
                {({session}) => (
                    <HashRouter>
                        <div className="dashboardApp vFlow">
                            <AppNavBar/>
                            <div style={{padding: '20px 200px'}}>
                                <ErrorBoundary>
                                    <Switch>
                                        {routes.map((route, i) => (
                                            <Route exact={route.exact} path={route.path} key={i}>
                                                {(route.requiresAuth && !session.userId) ? <div>Please login</div> :
                                                    <route.component/>}
                                            </Route>
                                        ))}
                                    </Switch>
                                </ErrorBoundary>
                            </div>
                        </div>
                    </HashRouter>
                )}

            </DvTemplateAuth.SessionProvider>
            </ThemeProvider>
        );
    }
;

ReactDOM.render(
    <App/>
    , document.getElementById('index'));
