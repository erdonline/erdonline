package com.erdonline.erd.socketio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SocketTicketServiceTest {

    @Mock
    private RedissonClient redisson;

    @Mock
    private RBucket<String> bucket;

    private SocketTicketService service;

    @BeforeEach
    void setUp() {
        service = new SocketTicketService(redisson);
    }

    @Test
    void issue_storesUserIdAndUsername() {
        when(redisson.<String>getBucket(anyString())).thenReturn(bucket);

        String ticket = service.issue("uid-1", "alice");

        assertFalse(ticket.isBlank());
        ArgumentCaptor<String> keyCap = ArgumentCaptor.forClass(String.class);
        verify(redisson).getBucket(keyCap.capture());
        assertTrue(keyCap.getValue().endsWith(ticket));
        verify(bucket).set(eq("uid-1\nalice"), eq(SocketTicketService.TTL));
    }

    @Test
    void resolve_roundTrip() {
        when(redisson.<String>getBucket(SocketTicketService.REDIS_PREFIX + "t1")).thenReturn(bucket);
        when(bucket.get()).thenReturn("uid-1\nalice");

        Optional<SocketTicketPrincipal> p = service.resolve("t1");
        assertTrue(p.isPresent());
        assertEquals("uid-1", p.get().userId());
        assertEquals("alice", p.get().username());
        assertEquals(Optional.of("alice"), service.resolveUsername("t1"));
    }

    @Test
    void resolve_rejectsLegacyUsernameOnly() {
        when(redisson.<String>getBucket(SocketTicketService.REDIS_PREFIX + "legacy")).thenReturn(bucket);
        when(bucket.get()).thenReturn("alice");

        assertTrue(service.resolve("legacy").isEmpty());
    }

    @Test
    void issue_blankRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.issue("", "a"));
        assertThrows(IllegalArgumentException.class, () -> service.issue("u", ""));
    }

    @Test
    void resolve_blankTicketEmpty() {
        assertTrue(service.resolve("").isEmpty());
        assertTrue(service.resolve(null).isEmpty());
    }
}
