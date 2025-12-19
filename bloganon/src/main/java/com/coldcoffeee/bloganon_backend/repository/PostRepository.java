package com.coldcoffeee.bloganon_backend.repository;

import com.coldcoffeee.bloganon_backend.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findTop100ByOrderByCreatedAtDesc();

    @Transactional
    @Modifying
    @Query(value = "DELETE FROM POST WHERE ID NOT IN (SELECT ID FROM POST ORDER BY CREATED_AT DESC LIMIT 100)", nativeQuery = true)
    int deleteAllExceptLatest100();
}
