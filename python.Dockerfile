FROM python:3.9

WORKDIR /app

COPY apps/model/requirements.txt /app

RUN pip install --no-cache-dir -r requirements.txt

COPY apps/model/script.py /app

ENTRYPOINT ["python", "script.py"]