package com.erdonline.common.security.component;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.MartinException;
import com.erdonline.common.core.exception.StatefulException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.common.DefaultThrowableAnalyzer;
import org.springframework.security.oauth2.common.exceptions.ClientAuthenticationException;
import org.springframework.security.oauth2.common.exceptions.InvalidGrantException;
import org.springframework.security.oauth2.common.exceptions.InvalidTokenException;
import org.springframework.security.oauth2.common.exceptions.OAuth2Exception;
import org.springframework.security.oauth2.provider.error.WebResponseExceptionTranslator;
import org.springframework.security.web.util.ThrowableAnalyzer;
import org.springframework.web.HttpRequestMethodNotSupportedException;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/4/13
 * @describtion MartinOauthResponseExceptionTranslator
 * @since 1.0
 */
@Slf4j
public class MartinOauthResponseExceptionTranslator implements WebResponseExceptionTranslator {

    private ThrowableAnalyzer throwableAnalyzer = new DefaultThrowableAnalyzer();

    @Override
    public ResponseEntity<R> translate(Exception e) {
        log.error("", e);
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store");
        headers.set(HttpHeaders.PRAGMA, "no-cache");
        Throwable[] causeChain = throwableAnalyzer.determineCauseChain(e);
        StatefulException statefulException = (StatefulException) throwableAnalyzer
                .getFirstThrowableOfType(StatefulException.class, causeChain);
        if (null != statefulException) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.fromCode(statefulException.getStatus())), headers, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        Exception ase = (AuthenticationException) throwableAnalyzer
                .getFirstThrowableOfType(AuthenticationException.class, causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.UNAUTHORIZED), headers, HttpStatus.UNAUTHORIZED);
        }
        ase = (AccessDeniedException) throwableAnalyzer.getFirstThrowableOfType(AccessDeniedException.class,
                causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.FORBIDDEN), headers, HttpStatus.FORBIDDEN);
        }
        ase = (InvalidGrantException) throwableAnalyzer.getFirstThrowableOfType(InvalidGrantException.class,
                causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.ERROR_USERNAME_OR_PASSWORD), headers, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        ase = (InvalidTokenException) throwableAnalyzer.getFirstThrowableOfType(InvalidTokenException.class, causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.INVALID_TOKEN), headers, HttpStatus.UNAUTHORIZED);
        }
        ase = (ClientAuthenticationException) throwableAnalyzer.getFirstThrowableOfType(ClientAuthenticationException.class,
                causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.BAD_REQUEST), headers, HttpStatus.BAD_REQUEST);
        }
        ase = (HttpRequestMethodNotSupportedException) throwableAnalyzer
                .getFirstThrowableOfType(HttpRequestMethodNotSupportedException.class, causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.METHOD_NOT_ALLOWED), headers, HttpStatus.METHOD_NOT_ALLOWED);

        }
        ase = (OAuth2Exception) throwableAnalyzer.getFirstThrowableOfType(OAuth2Exception.class, causeChain);
        if (ase != null) {
            return new ResponseEntity<>(R.failed(ApiErrorCode.OAUTH_ERROR), headers, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return new ResponseEntity<>(R.failed(ApiErrorCode.FAIL), headers, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

