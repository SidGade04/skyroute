package io.skyroute.api.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.skyroute.api.model.dto.request.SniperRequest;
import io.skyroute.api.model.dto.response.SniperQuote;
import io.skyroute.api.model.dto.response.SniperResponse;
import io.skyroute.api.service.SniperService;

@RestController
@RequestMapping("/api/v1/snipers")
@CrossOrigin(origins = "*")
public class SniperController {

    private final SniperService snipers;

    public SniperController(SniperService snipers) {
        this.snipers = snipers;
    }

    @PostMapping("/quote")
    public SniperQuote quote(@RequestBody SniperRequest request) {
        return snipers.quote(request);
    }

    @PostMapping
    public ResponseEntity<SniperResponse> arm(@AuthenticationPrincipal Jwt jwt, @RequestBody SniperRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(snipers.arm(jwt, request));
    }

    @GetMapping
    public List<SniperResponse> list(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) String status) {
        return snipers.list(jwt, status);
    }

    @GetMapping("/{id}")
    public SniperResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return snipers.get(jwt, id);
    }

    @PostMapping("/{id}/disarm")
    public SniperResponse disarm(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return snipers.disarm(jwt, id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        snipers.delete(jwt, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/rearm")
    public SniperResponse rearm(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestBody(required = false) SniperRequest request
    ) {
        return snipers.rearm(jwt, id, request);
    }
}
