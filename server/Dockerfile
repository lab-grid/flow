FROM continuumio/miniconda3

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

ENV FLASK_APP /app/main.py

# TODO: Replace this with a uwsgi server (gunicorn)
CMD python -m flask run --host=0.0.0.0 --port=${PORT}
