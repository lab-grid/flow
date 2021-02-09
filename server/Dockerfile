FROM continuumio/miniconda3

ARG SERVER_VERSION=local+container
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev
RUN pip install pipenv

# RUN conda install scikit-learn pandas
# RUN conda install -c rdkit rdkit
COPY Pipfile Pipfile
COPY Pipfile.lock Pipfile.lock
RUN pipenv lock --dev --requirements > requirements.txt
RUN pip install -r requirements.txt

COPY ./ .

ENV FLASK_APP=/app/main.py
ENV SERVER_VERSION=$SERVER_VERSION
ENV PYTHONPATH=/app

CMD uvicorn main:app --port ${PORT} --host 0.0.0.0 --timeout-keep-alive 120 --log-level debug
