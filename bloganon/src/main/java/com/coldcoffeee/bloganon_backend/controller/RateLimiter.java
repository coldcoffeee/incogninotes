package com.coldcoffeee.bloganon_backend.controller;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiter {

    private static final int MAX_REQUESTS = 5;
    private static final long WINDOW_MS = 60_000;

    private final Map<String, List<Long>> requests = new ConcurrentHashMap<>();

    public synchronized boolean allow(String key) {
        long now = System.currentTimeMillis();
        requests.putIfAbsent(key, new ArrayList<>());

        List<Long> timestamps = requests.get(key);
        timestamps.removeIf(ts -> ts < now - WINDOW_MS);

        if (timestamps.size() >= MAX_REQUESTS) {
            return false;
        }

        timestamps.add(now);
        return true;
    }
}

