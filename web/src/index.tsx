import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom-theme.scss'
import './index.css'
import App from './App';
import * as serviceWorker from './serviceWorker';
import { RecoilRoot } from 'recoil';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { LoadingPage } from './components/LoadingPage';
import 'react-datepicker/dist/react-datepicker.css';
// import 'react-datepicker/dist/react-datepicker-cssmodules.css';

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
      <DndProvider backend={HTML5Backend}>
        <Suspense fallback={<LoadingPage />}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Suspense>
      </DndProvider>
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
