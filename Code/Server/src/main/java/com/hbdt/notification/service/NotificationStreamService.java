package com.hbdt.notification.service;

import com.hbdt.notification.dto.NotificationResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationStreamService {

    private static final long TIMEOUT_MILLIS = 30L * 60L * 1000L;
    private final ConcurrentHashMap<Long, Set<SseEmitter>> clients = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MILLIS);
        clients.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(ignored -> remove(userId, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException exception) {
            remove(userId, emitter);
        }
        return emitter;
    }

    public void publish(Long userId, NotificationResponse notification) {
        Set<SseEmitter> emitters = clients.get(userId);
        if (emitters == null) return;
        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .id(String.valueOf(notification.id()))
                        .data(notification));
            } catch (IOException exception) {
                remove(userId, emitter);
            }
        });
    }

    private void remove(Long userId, SseEmitter emitter) {
        Set<SseEmitter> emitters = clients.get(userId);
        if (emitters == null) return;
        emitters.remove(emitter);
        if (emitters.isEmpty()) clients.remove(userId);
    }
}
