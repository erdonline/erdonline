package com.erdonline.common.data.util;

import com.erdonline.common.core.constant.CacheConstants;
import com.erdonline.common.core.enums.IdEnum;
import com.erdonline.common.data.redis.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.text.DecimalFormat;
import java.text.Format;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/21 20:44
 * @describtion: IdUtil
 */
@Component
public class OrderNoUtil {

    @Autowired
    private RedisUtil redisUtil;


    public  String getCacheKey(String serialPrefix) {
        return CacheConstants.ORDER_NO.concat(serialPrefix);
    }

    public  String getDay(IdEnum idEnum) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        StringBuffer sb = new StringBuffer();
        sb.append(idEnum.getPrefix());
        sb.append(formatter.format(LocalDateTime.now()));
        return sb.toString();
    }

    public  String completionSerial(Long serial) {
        Format formatCount = new DecimalFormat("0000");
        String serialFormat = formatCount.format(serial);
        return  serialFormat;
    }

    public String generateOrderNo(IdEnum idEnum) {
        String dayWithPrefix = this.getDay(idEnum);
        String redisCacheKey = this.getCacheKey(dayWithPrefix);
        Long serial = redisUtil.increment(redisCacheKey);
        String num =  dayWithPrefix + this.completionSerial(serial);
        return num;
    }
}

