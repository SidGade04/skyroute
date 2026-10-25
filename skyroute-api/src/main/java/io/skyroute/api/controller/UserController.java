package io.skyroute.api.controller;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.skyroute.api.model.dto.UserDTO;
import io.skyroute.api.model.dto.request.UpdateUserRequest;
import io.skyroute.api.service.UserService;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/phone-taken")
    public Map<String, Boolean> phoneTaken(@RequestParam String phone) {
        return Map.of("taken", userService.phoneTaken(phone));
    }

    @PostMapping("/sync")
    public UserDTO sync(@AuthenticationPrincipal Jwt jwt) {
        return userService.sync(jwt);
    }

    @GetMapping("/me")
    public UserDTO me(@AuthenticationPrincipal Jwt jwt) {
        return userService.me(jwt);
    }

    @PatchMapping("/me")
    public UserDTO update(@AuthenticationPrincipal Jwt jwt, @RequestBody UpdateUserRequest request) {
        return userService.update(jwt, request);
    }
}
