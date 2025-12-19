package com.coldcoffeee.bloganon_backend.controller;

import com.coldcoffeee.bloganon_backend.entity.Post;
import com.coldcoffeee.bloganon_backend.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin
public class PostController {

    private final PostService service;
    private final RateLimiter rateLimiter;

    public PostController(PostService service, RateLimiter rateLimiter) {
        this.service = service;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Post post,
            HttpServletRequest request) {

        String ip = request.getRemoteAddr();

        if (!rateLimiter.allow(ip)) {
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Too many posts. Try again later.");
        }

        if (post.getName() == null || post.getName().trim().isBlank()) {
            post.setName("Anonymous");
        }

        if (post.getName() != null && post.getName().length() > 30) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Name must be at most 30 characters.");
        }

        if (post.getContent() == null || post.getContent().trim().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Post content cannot be empty.");
        }

        if (post.getContent().length() > 1000) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Post content must be at most 1000 characters.");
        }

        return ResponseEntity.ok(service.save(post));
    }

    @GetMapping
    public List<Post> list() {
        return service.latest();
    }
}
