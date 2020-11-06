import React, { Suspense } from 'react';
import { Button, Form, InputGroup, Navbar } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import { BrowserRouter, Route, Link, Switch } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { LoadingPage } from './components/LoadingPage';
import { ProfileMenu, ProfileMenuLoading } from './components/ProfileMenu';
import { labflowOptions } from './config';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtocolEditorPage } from './pages/ProtocolEditorPage';
import { RunEditorPage } from './pages/RunEditorPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { auth0State } from './state/atoms';

export default function App() {
  const { auth0Client, isAuthenticated } = useRecoilValue(auth0State);
  if (!isAuthenticated) {
    switch (labflowOptions.authProvider) {
      case 'auth0':
        if (auth0Client) {
          auth0Client.loginWithRedirect()
          return (
            <div>
              This page requires users to be logged in first. Redirecting to login page...
            </div>
          )
        } else {
          throw new Error("Failed to redirect user to login url. Auth0 is not loaded yet!");
        }
    }
  }

  // TODO: Redirect user to the onboarding page if they haven't created a user profile yet.

  return (
    <BrowserRouter>
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand>
          <Link to="/">
            Flow by LabGrid
            </Link>
        </Navbar.Brand>
        <Form.Group className="my-auto mr-3 ml-auto">
          <InputGroup>
            <Typeahead
              id="quick-search"
              // multiple
              // flip
              // onChange={selections => {
              //   // selections.
              // }}
              options={[]}
              // selected={}
              // minLength={1}
              disabled={true}
              placeholder="Quick-search coming soon..."
            />
            <InputGroup.Append>
              <Button as={Link} to="/search">
                Advanced Search
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Form.Group>
        <Suspense fallback={<ProfileMenuLoading />}>
          <ProfileMenu />
        </Suspense>
      </Navbar>
      <div className="container">
        <Switch>
          <Route path="/search">
            <Suspense fallback={<LoadingPage />}>
              <SearchResultsPage />
            </Suspense>
          </Route>
          <Route path="/protocol/:id">
            <Suspense fallback={<LoadingPage />}>
              <ProtocolEditorPage />
            </Suspense>
          </Route>
          <Route path="/run/:id">
            <Suspense fallback={<LoadingPage />}>
              <RunEditorPage />
            </Suspense>
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
