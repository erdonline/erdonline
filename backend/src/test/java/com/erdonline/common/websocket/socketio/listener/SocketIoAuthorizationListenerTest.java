package com.erdonline.common.websocket.socketio.listener;

import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.socketio.SocketTicketPrincipal;
import com.erdonline.erd.socketio.SocketTicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SocketIoAuthorizationListenerTest {

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private SocketTicketService socketTicketService;

    @Mock
    private ProjectAcl projectAcl;

    @InjectMocks
    private SocketIoAuthorizationListener listener;

    private HandshakeData handshake;

    @BeforeEach
    void setUp() {
        handshake = mock(HandshakeData.class);
    }

    @Test
    void rejectsMissingProjectId() {
        when(handshake.getSingleUrlParam("projectId")).thenReturn(null);

        assertFalse(listener.isAuthorized(handshake));
        verify(projectAcl, never()).isMember(anyString(), anyString());
    }

    @Test
    void ticketMemberAllowed() {
        when(handshake.getSingleUrlParam("projectId")).thenReturn("p1");
        when(handshake.getSingleUrlParam("ticket")).thenReturn("t1");
        when(socketTicketService.resolve("t1"))
                .thenReturn(Optional.of(new SocketTicketPrincipal("u1", "alice")));
        when(projectAcl.isMember("p1", "u1")).thenReturn(true);

        assertTrue(listener.isAuthorized(handshake));
    }

    @Test
    void ticketNonMemberRejected() {
        when(handshake.getSingleUrlParam("projectId")).thenReturn("p1");
        when(handshake.getSingleUrlParam("ticket")).thenReturn("t1");
        when(socketTicketService.resolve("t1"))
                .thenReturn(Optional.of(new SocketTicketPrincipal("u1", "alice")));
        when(projectAcl.isMember("p1", "u1")).thenReturn(false);

        assertFalse(listener.isAuthorized(handshake));
    }

    @Test
    void invalidTicketRejected() {
        when(handshake.getSingleUrlParam("projectId")).thenReturn("p1");
        when(handshake.getSingleUrlParam("ticket")).thenReturn("bad");
        when(socketTicketService.resolve("bad")).thenReturn(Optional.empty());

        assertFalse(listener.isAuthorized(handshake));
        verify(projectAcl, never()).isMember(anyString(), anyString());
    }

    @Test
    void shortJwtMemberAllowed() {
        when(handshake.getSingleUrlParam("projectId")).thenReturn("p1");
        when(handshake.getSingleUrlParam("ticket")).thenReturn(null);
        when(handshake.getSingleUrlParam("token")).thenReturn("short.jwt");
        Jwt jwt = Jwt.withTokenValue("short.jwt")
                .header("alg", "none")
                .claim(SecurityConstants.TOKEN_USER_ID, "u2")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        when(jwtDecoder.decode("short.jwt")).thenReturn(jwt);
        when(projectAcl.isMember("p1", "u2")).thenReturn(true);

        assertTrue(listener.isAuthorized(handshake));
    }

    @Test
    void jwtInvalidRejected() {
        when(handshake.getSingleUrlParam("projectId")).thenReturn("p1");
        when(handshake.getSingleUrlParam("ticket")).thenReturn(null);
        when(handshake.getSingleUrlParam("token")).thenReturn("bad");
        when(jwtDecoder.decode("bad")).thenThrow(new JwtException("nope"));

        assertFalse(listener.isAuthorized(handshake));
    }
}
