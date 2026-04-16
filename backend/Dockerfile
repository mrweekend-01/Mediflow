FROM python:3.12-slim

WORKDIR /app

# Copia y convierte requirements.txt (está en UTF-16 LE)
COPY requirements.txt .
RUN python3 -c "open('/tmp/req.txt','w',encoding='utf-8').write(open('requirements.txt',encoding='utf-16').read())" \
    && pip install --no-cache-dir -r /tmp/req.txt

COPY . .

EXPOSE 8003

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--proxy-headers", "--forwarded-allow-ips=*"]
