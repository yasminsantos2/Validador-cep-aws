import json
import re
import urllib.error
import urllib.request

VIACEP_URL = "https://viacep.com.br/ws/{cep}/json/"


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def _normalize_cep(raw: str) -> str:
    return re.sub(r"\D", "", raw or "")


def _fetch_address(cep: str) -> dict:
    url = VIACEP_URL.format(cep=cep)
    request = urllib.request.Request(url, method="GET")

    with urllib.request.urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def handler(event, context):
    path_params = event.get("pathParameters") or {}
    raw_cep = path_params.get("cep", "")
    cep = _normalize_cep(raw_cep)

    if len(cep) != 8:
        return _response(
            400,
            {
                "valido": False,
                "erro": "CEP inválido. Informe 8 dígitos.",
                "cep_informado": raw_cep,
            },
        )

    try:
        data = _fetch_address(cep)
    except urllib.error.HTTPError:
        return _response(
            502,
            {"valido": False, "erro": "Falha ao consultar o serviço de CEP."},
        )
    except urllib.error.URLError:
        return _response(
            503,
            {"valido": False, "erro": "Serviço de CEP indisponível no momento."},
        )
    except Exception:
        return _response(
            500,
            {"valido": False, "erro": "Erro interno ao validar o CEP."},
        )

    if data.get("erro"):
        return _response(
            404,
            {
                "valido": False,
                "erro": "CEP não encontrado.",
                "cep": cep,
            },
        )

    return _response(
        200,
        {
            "valido": True,
            "cep": data.get("cep", cep),
            "logradouro": data.get("logradouro"),
            "complemento": data.get("complemento"),
            "bairro": data.get("bairro"),
            "localidade": data.get("localidade"),
            "uf": data.get("uf"),
            "ibge": data.get("ibge"),
        },
    )
