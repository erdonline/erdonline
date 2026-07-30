package com.erdonline.common.core.support;

import cn.hutool.core.collection.CollUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/17
 * @describtion SpringContextHelper
 * @since 1.0
 */
@Component
@Lazy(false)
@Slf4j
public class SpringContextHelper implements ApplicationContextAware, DisposableBean {

    public static ApplicationContext getApplicationContext() {
        if (APPLICATION_CONTEXT == null) {
            log.error("ApplicationContextAware未注入上下文信息");
        }
        return APPLICATION_CONTEXT;
    }

    /***
     * ApplicationContext上下文
     */
    private static ApplicationContext APPLICATION_CONTEXT = null;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        if (log.isDebugEnabled()) {
            log.debug("==== martin data 自动绑定上下文信息 ====");
        }
        APPLICATION_CONTEXT = applicationContext;
    }


    /***
     * 根据beanId获取Bean实例
     * @param beanId
     * @return
     */
    public static Object getBean(String beanId) {
        return getApplicationContext().getBean(beanId);
    }

    /***
     * 获取指定类型的单个Bean实例
     * @param clazz
     * @return
     */
    public static <T> T getBean(Class<T> clazz) {
        try {
            return getApplicationContext().getBean(clazz);
        } catch (Exception e) {
            log.debug("无法找到 bean: {}", clazz.getSimpleName());
            return null;
        }
    }

    /***
     * 获取指定类型的全部实现类
     * @param type
     * @param <T>
     * @return
     */
    public static <T> List<T> getBeans(Class<T> type) {
        Map<String, T> map = getApplicationContext().getBeansOfType(type);
        if (CollUtil.isEmpty(map)) {
            return null;
        }
        List<T> beanList = new ArrayList<>();
        beanList.addAll(map.values());
        return beanList;
    }

    /***
     * 根据注解获取beans
     * @param annotationType
     * @return
     */
    public static List<Object> getBeansByAnnotation(Class<? extends Annotation> annotationType) {
        Map<String, Object> map = getApplicationContext().getBeansWithAnnotation(annotationType);
        if (CollUtil.isEmpty(map)) {
            return null;
        }
        List<Object> beanList = new ArrayList<>();
        beanList.addAll(map.values());
        return beanList;
    }

    /**
     * 发布事件
     *
     * @param event
     */
    public static void publishEvent(ApplicationEvent event) {
        if (APPLICATION_CONTEXT == null) {
            return;
        }
        APPLICATION_CONTEXT.publishEvent(event);
    }

    /**
     * 实现DisposableBean接口, 在Context关闭时清理静态变量.
     */
    @Override
    public void destroy() {
        clearContext();
    }

    /**
     * 清除SpringContextHolder中的ApplicationContext为Null.
     */
    public static void clearContext() {
        if (log.isDebugEnabled()) {
            log.debug("清除 SpringContextHelper 中的ApplicationContext:" + APPLICATION_CONTEXT);
        }
        APPLICATION_CONTEXT = null;
    }
}
