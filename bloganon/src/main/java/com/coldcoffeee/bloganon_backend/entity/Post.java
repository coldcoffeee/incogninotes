package com.coldcoffeee.bloganon_backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30)
    private String name;

    @Column(length = 1000)
    private String content;

    private Instant createdAt;

    public Long getId() { return id; }

    public void setCreatedAt(Instant now) {
        this.createdAt = now;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String anonymous) {
        this.name = anonymous.trim().isBlank() ? "Anonymous" : anonymous;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
