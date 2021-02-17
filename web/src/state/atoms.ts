import { atom } from "recoil";
import { Auth0State, getAuth0State } from "../auth";


// ----------------------------------------------------------------------------
// Auth0 ----------------------------------------------------------------------
// ----------------------------------------------------------------------------

export const auth0State = atom<Auth0State>({
  key: "auth0State",
  default: getAuth0State(),
});


export interface ErrorsState {
  errors?: Error[];
}

export const errorsState = atom<ErrorsState>({
  key: "errorsState",
  default: {},
});
