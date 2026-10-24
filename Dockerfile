FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd --uid 10001 --create-home abt
COPY server.py gunicorn.conf.py ./
RUN mkdir /data && chown abt:abt /data
USER abt
ENV DATA_DIR=/data PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["gunicorn", "--config", "gunicorn.conf.py", "server:application"]
