package com.erdonline.common.vip.aspect;


import com.erdonline.common.vip.annotation.VIP;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Before;

/**
 *@author 零代科技
 *@version 1.0
 *@date 2023/5/6 18:02
 *@describtion VIPAroundAspect
 */
public interface VIPAspect {

    /**
     * @author 零代科技
     * @date 2023/5/6
     * @description 触发会员权益之前
     * @param context
     **/
    @Before("@annotation(vip)")
    void beforeProcess(JoinPoint point, VIP vip);

    /**
     * @author 零代科技
     * @date 2023/5/6
     * @description 触发会员权益之后
     * @param context
     **/
    @After("@annotation(vip)")
    void afterProcess(JoinPoint point, VIP vip);
}
