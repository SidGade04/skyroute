package io.skyroute.api.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.skyroute.api.model.dto.UserDTO;
import io.skyroute.api.service.UserService;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/sync")
    public UserDTO sync(@AuthenticationPrincipal Jwt jwt) {
        return userService.sync(jwt);
    }

    @GetMapping("/me")
    public UserDTO me(@AuthenticationPrincipal Jwt jwt) {
        return userService.me(jwt);
    }
}
