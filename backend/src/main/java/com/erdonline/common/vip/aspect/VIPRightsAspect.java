package com.erdonline.common.vip.aspect;

import com.erdonline.common.vip.annotation.VIP;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;


/**
 * VIP 权益切面（开源版：限制一律放行）。
 * 保留注解与 License 上传能力，但不再按人数/项目数/AI 次数拦截。
 */
@Aspect
@Component
@Slf4j
public class VIPRightsAspect implements VIPAspect {
    @Override
    public void beforeProcess(JoinPoint point, VIP vip) {
        // 开源：不校验 VIP 限额
    }

    @Override
    public void afterProcess(JoinPoint point, VIP vip) {
        // 开源：不累计 VIP 计数
    }
}
