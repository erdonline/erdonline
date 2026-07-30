package com.erdonline.common.data.tenant;

import com.alibaba.ttl.TransmittableThreadLocal;
import lombok.experimental.UtilityClass;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/11/5
 * @describtion TenantContextHolder, 将租户id在各线程中传递
 * @since 1.0
 */
@UtilityClass
public class TenantContextHolder {
    /**
     * TransmittableThreadLocal阿里基于ThreadLocal做的一个线程共享信息的插件
     */
    private final ThreadLocal<Integer> THREAD_LOCAL_TENANT = new TransmittableThreadLocal<>();

    /**
     * TTL 设置租户Id
     *
     * @param tenantId
     */
    public void setTenantId(Integer tenantId) {
        THREAD_LOCAL_TENANT.set(tenantId);
    }

    /**
     * 获取TTL中的租户Id
     *
     * @return
     */
    public Integer getTenantId() {
        return THREAD_LOCAL_TENANT.get();
    }

    /**
     * 清空线程中绑定的租户Id,这个方法要慎用，一旦清除，用户所有涉及到租户的信息就没了
     */
    public void clear() {
        THREAD_LOCAL_TENANT.remove();
    }
}
