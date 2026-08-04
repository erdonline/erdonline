package com.erdonline.erd.publicapi;

import com.erdonline.erd.entity.PersonalAccessToken;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 鉴权主体由哈希命中后的行构造；明文永不落入实体。
 */
class PersonalAccessTokenAuthTest {

    @Test
    void toAuthenticatedPat_mapsScopesAndUser_withoutPlaintext() {
        String plain = PatTokenCodec.generatePlaintext();
        PersonalAccessToken row = new PersonalAccessToken();
        row.setId("tok1");
        row.setUserId("u1");
        row.setUsername("alice");
        row.setTokenHash(PatTokenCodec.hash(plain));
        row.setScopes(PatScopes.toCsv(PatScopes.DEFAULT_READ));
        row.setRevoked("0");

        PersonalAccessTokenService.AuthenticatedPat auth =
                PersonalAccessTokenServiceImpl.toAuthenticatedPat(row);

        assertEquals("alice", auth.user().getUsername());
        assertEquals("u1", auth.user().getId());
        assertEquals("tok1", auth.tokenId());
        assertTrue(auth.scopes().contains(PatScopes.PROJECTS_READ));
        assertTrue(auth.scopes().contains(PatScopes.VERSIONS_READ));
        assertNotEquals(plain, row.getTokenHash());
        assertEquals(64, row.getTokenHash().length());
    }

    @Test
    void hashLookupKeyIsStableAcrossEncode() {
        String plain = PatTokenCodec.generatePlaintext();
        assertEquals(PatTokenCodec.hash(plain), PatTokenCodec.hash(plain));
        assertTrue(PatTokenCodec.looksLikePat(plain));
    }
}
