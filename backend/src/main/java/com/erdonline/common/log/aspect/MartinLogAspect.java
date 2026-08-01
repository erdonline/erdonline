package com.erdonline.common.log.aspect;

import cn.hutool.core.convert.Convert;
import cn.hutool.core.util.URLUtil;
import cn.hutool.extra.servlet.JakartaServletUtil;
import cn.hutool.http.HttpStatus;
import cn.hutool.http.HttpUtil;
import com.erdonline.common.bean.system.Log;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.common.log.event.LogEvent;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion MartinLogAspect
 * @since 1.0
 */
@Aspect
@Component
@Slf4j
public class MartinLogAspect {
    @Around("@annotation(martinLog)")
    public Object around(ProceedingJoinPoint point, MartinLog martinLog) throws Throwable {
        //解决异步线程，父子线程无法共享session、request
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        RequestContextHolder.setRequestAttributes(requestAttributes, true);
        Log log = initLog();
        Long startTime = System.currentTimeMillis();
        Object obj = null;
        try {
            obj = point.proceed();
            log.setType(HttpStatus.HTTP_OK);
        } catch (Exception e) {
            log.setException(e.getMessage());
            log.setType(HttpStatus.HTTP_INTERNAL_ERROR);
            throw e;
        } finally {
            Long endTime = System.currentTimeMillis();
            log.setTitle(martinLog.value());
            log.setTime((endTime - startTime));
            log.setBody(Convert.toStr(point.getArgs()));
            // 发送异步日志事件,在日志保存的接口上，不能增加MartinLog注解，不然会死循环
            SpringContextHelper.publishEvent(new LogEvent(log));
        }
        return obj;
    }

    public Log initLog() {
        Log log = new Log();
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        log.setRemoteAddr(JakartaServletUtil.getClientIP(request));
        log.setRequestUri(URLUtil.getPath(request.getRequestURI()));
        log.setMethod(request.getMethod());
        log.setUserAgent(request.getHeader("user-agent"));
        log.setParams(URLUtil.decode(HttpUtil.toParams(request.getParameterMap())));
        return log;
    }

}
