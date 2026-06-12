FROM python:3.13.14-alpine3.23

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv
RUN uv pip install --system -r pyproject.toml 

COPY . .

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]