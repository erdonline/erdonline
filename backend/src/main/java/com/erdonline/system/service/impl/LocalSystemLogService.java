package com.erdonline.system.service.impl;

import com.erdonline.common.api.system.RemoteSystemLog;
import com.erdonline.common.bean.system.Log;
import com.erdonline.common.core.api.R;
import com.erdonline.system.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * RemoteSystemLog 的本地实现（单体化后取代原 Feign 远程调用 POST /log）。
 * 直接委托给本地 {@link LogService}，行为等价于原 LogController#save。
 */
@Service
@RequiredArgsConstructor
public class LocalSystemLogService implements RemoteSystemLog {

    private final LogService logService;

    @Override
    public R addSystemLog(Log log) {
        return R.ok(logService.save(log));
    }
}
