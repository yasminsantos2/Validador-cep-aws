import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse


app = FastAPI(
    title="CEP Proxy Tester",
    description="Proxy minimo em FastAPI para testar o endpoint AWS CEP pelo Swagger.",
    version="1.0.0",
)


def _base_url() -> str:
    value = os.getenv("AWS_CEP_API_BASE_URL", "").strip()
    if not value:
        raise HTTPException(
            status_code=500,
            detail="Defina a variavel de ambiente AWS_CEP_API_BASE_URL.",
        )
    return value.rstrip("/")


@app.get("/health", tags=["infra"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/cep/{cep}", tags=["cep"])
async def consultar_cep(cep: str) -> Any:
    if not cep.isdigit() or len(cep) != 8:
        raise HTTPException(status_code=400, detail="CEP deve conter 8 digitos.")

    url = f"{_base_url()}/cep/{cep}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Timeout ao chamar API AWS.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Falha na chamada da API AWS.") from exc

    # Mantem o payload e status da API serverless original.
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw_response": response.text}

    if response.status_code != 200:
        return JSONResponse(status_code=response.status_code, content=payload)

    return payload
