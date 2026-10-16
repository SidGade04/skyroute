package io.skyroute.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class SkyrouteApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SkyrouteApiApplication.class, args);
	}

}
