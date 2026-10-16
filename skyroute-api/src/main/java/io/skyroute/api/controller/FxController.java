package io.skyroute.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.skyroute.api.model.dto.FxRatesDTO;
import io.skyroute.api.service.FxService;

@RestController
@RequestMapping("/api/v1/fx")
public class FxController {

    private final FxService fxService;

    public FxController(FxService fxService) {
        this.fxService = fxService;
    }

    @GetMapping("/rates")
    public FxRatesDTO rates() {
        return fxService.getLatest();
    }
}
