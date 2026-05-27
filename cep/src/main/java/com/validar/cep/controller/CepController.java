package com.validar.cep.controller;

import com.validar.cep.service.CepProxyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cep")
public class CepController {

    private final CepProxyService cepProxyService;

    public CepController(CepProxyService cepProxyService) {
        this.cepProxyService = cepProxyService;
    }

    @GetMapping("/{cep}")
    public ResponseEntity<String> consultarCep(@PathVariable String cep) {
        return cepProxyService.consultarCep(cep);
    }
}
