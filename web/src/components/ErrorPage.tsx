import React from "react";
import { Button, Container, Row } from "react-bootstrap";

export function ErrorPage({ error, retry }: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <Container role="alert">
      <Row>
        <p className="mr-auto ml-auto">Something went wrong: {error.name}</p>
      </Row>
      <Row>
        <pre className="mr-auto ml-auto">{error.message}</pre>
      </Row>
      <Row>
        <Button className="mr-auto ml-auto" onClick={retry} variant="primary">Try again</Button>
      </Row>
    </Container>
  )
}
