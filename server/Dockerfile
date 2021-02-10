FROM python:3.9-alpine

ARG SERVER_VERSION=local+container
WORKDIR /app

RUN apk add --update git build-base libffi-dev rust cargo openssl-dev
RUN pip install -U pip pipenv

COPY Pipfile Pipfile
COPY Pipfile.lock Pipfile.lock
RUN pipenv lock --dev --requirements > requirements.txt
RUN pip install -r requirements.txt

COPY ./ .

ENV FLASK_APP=/app/main.py
ENV SERVER_VERSION=$SERVER_VERSION
ENV PYTHONPATH=/app

CMD uvicorn main:app --port ${PORT} --host 0.0.0.0 --timeout-keep-alive 120 --log-level debug
