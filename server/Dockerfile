FROM continuumio/miniconda3

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev

# RUN conda install scikit-learn pandas
# RUN conda install -c rdkit rdkit
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY test_requirements.txt test_requirements.txt
RUN pip install -r test_requirements.txt

COPY ./ .

ENV FLASK_APP /app/main.py

# TODO: Replace this with a uwsgi server (gunicorn)
CMD python -m flask run --host=0.0.0.0 --port=${PORT}
