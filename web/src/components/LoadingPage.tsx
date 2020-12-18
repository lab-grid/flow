import React from 'react';
import { Spinner } from 'react-bootstrap';

export function LoadingPage() {
    return <div className="d-flex mt-5">
      <div className="col"></div>
      <div className="col-auto">
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
      </div>
      <div className="col"></div>
    </div>
}