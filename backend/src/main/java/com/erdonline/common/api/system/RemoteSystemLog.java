package com.erdonline.common.api.system;

import com.erdonline.common.bean.system.Log;
import com.erdonline.common.core.api.R;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion RemoteSystemLog
 * @since 1.0
 */
public interface RemoteSystemLog {
    /**
     * 插入系统操作日志
     *
     * @param log
     * @return
     */
    @PostMapping("/log")
    R addSystemLog(@RequestBody Log log);
}
