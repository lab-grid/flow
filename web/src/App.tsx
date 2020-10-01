import React from 'react';
import { Nav, Navbar } from 'react-bootstrap';
import { BrowserRouter, Route, Redirect, Link, Switch } from 'react-router-dom';
import { ProfileMenu } from './components/ProfileMenu';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtocolEditorPage } from './pages/ProtocolEditorPage';
import { RunEditorPage } from './pages/RunEditorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand>
          <Link to="/">
            LabFlow
          </Link>
        </Navbar.Brand>
        <Nav className="mr-auto"></Nav>
        <ProfileMenu />
      </Navbar>
      <div className="container">
        <Switch>
          <Route path="/protocol/:id">
            <ProtocolEditorPage />
          </Route>
          <Route path="/run/:id">
            <RunEditorPage />
          </Route>
          <Route path="/profile/:id">
            <ProfilePage />
          </Route>
          <Route path="/">
            <HomePage />
          </Route>
          {/* <Redirect from="/profile" to={`/profile/${user.id}`} /> */}
        </Switch>
      </div>
    </BrowserRouter>
  );
}
