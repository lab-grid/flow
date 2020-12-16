import React, { Suspense } from 'react';
import { Button, Form, InputGroup, Navbar, OverlayTrigger, Toast, Tooltip } from 'react-bootstrap';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { Typeahead } from 'react-bootstrap-typeahead';
import { ErrorBoundary } from 'react-error-boundary';
import {  Route, Link, Switch } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { LoadingPage } from './components/LoadingPage';
import { ProfileMenu, ProfileMenuLoading } from './components/ProfileMenu';
import { labflowOptions } from './config';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtocolEditorPage } from './pages/ProtocolEditorPage';
import { RunEditorPage } from './pages/RunEditorPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { auth0State, errorsState } from './state/atoms';
import { serverHealth } from './state/selectors';
import { useGoogleAnalytics, usePageTracking } from './analytics';

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="container">
      <div className="row">
        <p className="mr-auto ml-auto">Something went wrong: {error.name}</p>
      </div>
      <div className="row">
        <pre className="mr-auto ml-auto">{error.message}</pre>
      </div>
      <div className="row">
        <Button className="mr-auto ml-auto" onClick={resetErrorBoundary} variant="primary">Try again</Button>
      </div>
    </div>
  )
}

export default function App() {
  useGoogleAnalytics();
  usePageTracking();
  const { auth0Client, isAuthenticated } = useRecoilValue(auth0State);
  const { errors } = useRecoilValue(errorsState);
  const serverInfo = useRecoilValue(serverHealth);
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

  return <>
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand>
        <Link className="product-name" to="/">
          Flow by LabGrid
        </Link>
      </Navbar.Brand>
      <OverlayTrigger
        placement="right"
        overlay={
          <Tooltip id="app-version-tooltip">
            <p>Webapp Version: {process.env.REACT_APP_VERSION}</p>
            <p>Server Version: {(serverInfo && serverInfo.version) || <i>Unknown</i>}</p>
          </Tooltip>
        }
      >
        <InfoCircleFill />
      </OverlayTrigger>
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
    <Switch>
      <Route path="/search">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingPage />}>
            <div className="container">
              <SearchResultsPage />
            </div>
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/protocol/:id">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingPage />}>
            <ProtocolEditorPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/run/:id">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingPage />}>
            <div className="container">
              <RunEditorPage />
            </div>
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/profile">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingPage />}>
            <div className="container">
              <ProfilePage />
            </div>
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/profile/:id">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingPage />}>
            <div className="container">
              <ProfilePage />
            </div>
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingPage />}>
            <div className="container">
              <HomePage />
            </div>
          </Suspense>
        </ErrorBoundary>
      </Route>
      {/* <Redirect from="/profile" to={`/profile/${user.id}`} /> */}
    </Switch>
    {errors && <div className="errors-overlay">
      {errors.map(error => <Toast>
        <Toast.Header>
          <strong className="mr-auto">Error: {error.name}</strong>
        </Toast.Header>
        <Toast.Body>{error.message}</Toast.Body>
      </Toast>)}
    </div>}
  </>;
}
