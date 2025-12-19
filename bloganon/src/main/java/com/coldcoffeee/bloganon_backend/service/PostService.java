package com.coldcoffeee.bloganon_backend.service;

import com.coldcoffeee.bloganon_backend.entity.Post;
import com.coldcoffeee.bloganon_backend.repository.PostRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class PostService {

    private final PostRepository repo;
    private final SimpMessagingTemplate messagingTemplate;

    public PostService(PostRepository repo,
                       SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
    }

    public Post save(Post post) {
        // Enforce max content length
        String content = post.getContent();
        if (content != null && content.length() > 1000) {
            post.setContent(content.substring(0, 1000));
        }

        post.setCreatedAt(Instant.now());
        Post saved = repo.save(post);

        // Keep only latest 100 posts efficiently
        repo.deleteAllExceptLatest100();

        // 🔔 Broadcast new post
        messagingTemplate.convertAndSend("/topic/posts", saved);

        return saved;
    }

    public List<Post> latest() {
        return repo.findTop100ByOrderByCreatedAtDesc();
    }
}
