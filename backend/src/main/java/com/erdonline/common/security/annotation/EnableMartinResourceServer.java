package com.erdonline.common.security.annotation;

import com.erdonline.common.security.MartinSecurityAutoConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/29 11:07
 * @describtion EnableMartinResourceServer
 * @since 1.0
 */
@Documented
@Inherited
@EnableResourceServer
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@EnableGlobalMethodSecurity(prePostEnabled = true)
@Import({MartinSecurityAutoConfiguration.class})
public @interface EnableMartinResourceServer {
}
